import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { Request, Response, NextFunction } from "express";

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: err.message,
    });
  }

  logger.error({ err, path: req.path, method: req.method }, "Unhandled error");

  return res.status(500).json({
    message: "Internal Server Error",
  });
}
