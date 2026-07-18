import { createHash, randomBytes, randomUUID } from "node:crypto";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import type { AuthLoginResponseDto } from "@eduvy/contracts";
import type { ApiEnv } from "@eduvy/config";
import { PrismaClient } from "@eduvy/database";
import * as argon2 from "argon2";
import { SignJWT, jwtVerify } from "jose";
import { API_ENV } from "../../common/config/config.module";
import { InjectPrisma } from "../../common/database/database.module";
import { AuditService } from "../audit/audit.service";

export interface AccessTokenPayload {
  userId: string;
  sessionId: string;
}

@Injectable()
export class PasswordService {
  async hash(password: string) {
    return argon2.hash(password, { type: argon2.argon2id });
  }

  async verify(hash: string, password: string) {
    return argon2.verify(hash, password);
  }
}

@Injectable()
export class SessionService {
  constructor(@InjectPrisma() private readonly prisma: PrismaClient) {}

  hashRefreshToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  generateRefreshToken() {
    return randomBytes(48).toString("base64url");
  }

  async createSession(input: {
    userId: string;
    deviceName?: string;
    userAgentSummary?: string;
    ipAddress?: string;
    ttlSeconds: number;
  }) {
    const refreshToken = this.generateRefreshToken();
    const session = await this.prisma.session.create({
      data: {
        userId: input.userId,
        tokenFamilyId: randomUUID(),
        refreshTokenHash: this.hashRefreshToken(refreshToken),
        deviceName: input.deviceName,
        userAgentSummary: input.userAgentSummary,
        ipAddress: input.ipAddress,
        expiresAt: new Date(Date.now() + input.ttlSeconds * 1000),
      },
    });
    return { session, refreshToken };
  }

  async rotateRefreshToken(input: {
    sessionId: string;
    presentedToken: string;
    ttlSeconds: number;
  }) {
    const session = await this.prisma.session.findUnique({ where: { id: input.sessionId } });
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException({ code: "SESSION_INVALID", message: "Sessão inválida." });
    }

    const presentedHash = this.hashRefreshToken(input.presentedToken);
    if (presentedHash !== session.refreshTokenHash) {
      await this.prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date(), revokeReason: "refresh_token_reuse_detected" },
      });
      throw new UnauthorizedException({ code: "SESSION_COMPROMISED", message: "Sessão revogada." });
    }

    const newRefreshToken = this.generateRefreshToken();
    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: this.hashRefreshToken(newRefreshToken),
        lastSeenAt: new Date(),
        expiresAt: new Date(Date.now() + input.ttlSeconds * 1000),
      },
    });

    return { refreshToken: newRefreshToken, session };
  }

  async revokeSession(sessionId: string, reason: string) {
    await this.prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date(), revokeReason: reason },
    });
  }
}

@Injectable()
export class TokenService {
  private readonly accessSecret: Uint8Array;

  constructor(@Inject(API_ENV) private readonly env: ApiEnv) {
    this.accessSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
  }

  async signAccessToken(input: AccessTokenPayload): Promise<{ token: string; expiresAt: Date }> {
    const expiresAt = new Date(Date.now() + this.env.ACCESS_TOKEN_TTL_SECONDS * 1000);
    const token = await new SignJWT({ sid: input.sessionId })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(input.userId)
      .setIssuedAt()
      .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
      .sign(this.accessSecret);

    return { token, expiresAt };
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    const { payload } = await jwtVerify(token, this.accessSecret);
    if (!payload.sub || typeof payload.sid !== "string") {
      throw new Error("INVALID_ACCESS_TOKEN");
    }
    return { userId: payload.sub, sessionId: payload.sid };
  }
}

@Injectable()
export class CsrfService {
  generateToken() {
    return randomBytes(32).toString("base64url");
  }
}

@Injectable()
export class IdentityService {
  constructor(
    @InjectPrisma() private readonly prisma: PrismaClient,
    private readonly passwords: PasswordService,
    private readonly sessions: SessionService,
    private readonly tokens: TokenService,
    private readonly csrf: CsrfService,
    private readonly audit: AuditService,
    @Inject(API_ENV) private readonly env: ApiEnv,
  ) {}

  private async buildAuthResponse(input: {
    user: { id: string; email: string; fullName: string };
    sessionId: string;
    refreshToken: string;
    refreshExpiresAt: Date;
  }): Promise<AuthLoginResponseDto> {
    const { token, expiresAt } = await this.tokens.signAccessToken({
      userId: input.user.id,
      sessionId: input.sessionId,
    });

    return {
      user: {
        id: input.user.id,
        email: input.user.email,
        fullName: input.user.fullName,
      },
      accessToken: token,
      refreshToken: input.refreshToken,
      sessionId: input.sessionId,
      accessExpiresAt: expiresAt.toISOString(),
      refreshExpiresAt: input.refreshExpiresAt.toISOString(),
      csrfToken: this.csrf.generateToken(),
    };
  }

  async register(input: {
    email: string;
    password: string;
    fullName: string;
    requestId: string;
  }) {
    const passwordHash = await this.passwords.hash(input.password);
    const user = await this.prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        fullName: input.fullName,
        authIdentities: {
          create: {
            provider: "EMAIL",
            passwordHash,
          },
        },
      },
    });

    await this.audit.record({
      actorType: "USER",
      actorUserId: user.id,
      action: "user.registered",
      resourceType: "user",
      resourceId: user.id,
      requestId: input.requestId,
    });

    const { session, refreshToken } = await this.sessions.createSession({
      userId: user.id,
      ttlSeconds: this.env.REFRESH_TOKEN_TTL_SECONDS,
    });

    return this.buildAuthResponse({
      user,
      sessionId: session.id,
      refreshToken,
      refreshExpiresAt: session.expiresAt,
    });
  }

  async login(input: {
    email: string;
    password: string;
    requestId: string;
    ipAddress?: string;
    userAgentSummary?: string;
    rememberMe?: boolean;
  }): Promise<AuthLoginResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
      include: { authIdentities: true },
    });

    const identity = user?.authIdentities.find(
      (item: { provider: string; passwordHash: string | null }) => item.provider === "EMAIL",
    );
    if (!user || !identity?.passwordHash) {
      await this.audit.record({
        actorType: "SYSTEM",
        action: "auth.login_failed",
        resourceType: "user",
        requestId: input.requestId,
        metadata: { email: input.email.toLowerCase() },
      });
      throw new UnauthorizedException({ code: "INVALID_CREDENTIALS", message: "Credenciais inválidas." });
    }

    const valid = await this.passwords.verify(identity.passwordHash, input.password);
    if (!valid) {
      await this.audit.record({
        actorType: "USER",
        actorUserId: user.id,
        action: "auth.login_failed",
        resourceType: "user",
        resourceId: user.id,
        requestId: input.requestId,
      });
      throw new UnauthorizedException({ code: "INVALID_CREDENTIALS", message: "Credenciais inválidas." });
    }

    const ttlSeconds = input.rememberMe
      ? this.env.REFRESH_TOKEN_TTL_SECONDS
      : Math.min(this.env.REFRESH_TOKEN_TTL_SECONDS, 86_400);

    const { session, refreshToken } = await this.sessions.createSession({
      userId: user.id,
      ipAddress: input.ipAddress,
      userAgentSummary: input.userAgentSummary,
      ttlSeconds,
    });

    await this.audit.record({
      actorType: "USER",
      actorUserId: user.id,
      action: "auth.login_success",
      resourceType: "session",
      resourceId: session.id,
      requestId: input.requestId,
    });

    return this.buildAuthResponse({
      user,
      sessionId: session.id,
      refreshToken,
      refreshExpiresAt: session.expiresAt,
    });
  }

  async refresh(input: {
    sessionId: string;
    refreshToken: string;
    requestId: string;
  }): Promise<AuthLoginResponseDto> {
    const { refreshToken, session } = await this.sessions.rotateRefreshToken({
      sessionId: input.sessionId,
      presentedToken: input.refreshToken,
      ttlSeconds: this.env.REFRESH_TOKEN_TTL_SECONDS,
    });

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: session.userId } });

    await this.audit.record({
      actorType: "USER",
      actorUserId: user.id,
      action: "auth.refresh_success",
      resourceType: "session",
      resourceId: session.id,
      requestId: input.requestId,
    });

    return this.buildAuthResponse({
      user,
      sessionId: session.id,
      refreshToken,
      refreshExpiresAt: session.expiresAt,
    });
  }

  async logout(input: { sessionId: string; userId: string; requestId: string }) {
    await this.sessions.revokeSession(input.sessionId, "user_logout");
    await this.audit.record({
      actorType: "USER",
      actorUserId: input.userId,
      action: "auth.logout",
      resourceType: "session",
      resourceId: input.sessionId,
      requestId: input.requestId,
    });
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, fullName: true },
    });
    if (!user) {
      throw new UnauthorizedException({ code: "USER_NOT_FOUND", message: "Usuário não encontrado." });
    }
    return user;
  }
}
