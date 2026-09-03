import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 400;
  const responseJSON = {
    version: 1,
    status: 'ERROR',
    message: err.message || 'An unexpected error occurred',
  };

  res.status(statusCode).json(responseJSON);
};
