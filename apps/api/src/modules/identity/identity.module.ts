import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import {
  CsrfService,
  IdentityService,
  PasswordService,
  SessionService,
  TokenService,
} from "./identity.service";

@Module({
  controllers: [AuthController],
  providers: [
    IdentityService,
    PasswordService,
    SessionService,
    TokenService,
    CsrfService,
  ],
  exports: [IdentityService, SessionService, TokenService],
})
export class IdentityModule {}
