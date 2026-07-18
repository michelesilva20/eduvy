import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Logger } from "@eduvy/logger";
import type { Request, Response } from "express";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string }>();

    const requestId = request.requestId ?? "unknown";
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: Record<string, unknown> = {
      type: "internal_error",
      code: "INTERNAL_ERROR",
      message: "Ocorreu um erro inesperado.",
      requestId,
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const payload = exception.getResponse();
      if (typeof payload === "object" && payload !== null) {
        body = {
          type: (payload as { type?: string }).type ?? "http_error",
          code: (payload as { code?: string }).code ?? "HTTP_ERROR",
          message: (payload as { message?: string }).message ?? exception.message,
          requestId,
          details: (payload as { details?: unknown }).details,
        };
      } else {
        body.message = String(payload);
      }
    } else if (exception instanceof Error) {
      this.logger.error({ err: exception, requestId }, "Unhandled exception");
    }

    response.status(status).json(body);
  }
}
