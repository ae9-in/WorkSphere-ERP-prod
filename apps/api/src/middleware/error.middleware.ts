import { Request, Response, NextFunction } from 'express';

export function errorMiddleware(
  err: Error & { statusCode?: number; errors?: unknown[] },
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500;
  const message    = err.message ?? 'Internal server error';

  console.error(`[ERROR] ${statusCode} — ${message}`, err.stack);

  res.status(statusCode).json({
    success: false,
    error:   err.name ?? 'Error',
    message,
    ...(err.errors ? { errors: err.errors } : {}),
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error:   'NotFound',
    message: `Route ${req.method} ${req.path} not found`,
  });
}
