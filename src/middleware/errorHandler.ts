import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/apiResponse.js';
import { config } from '../config/environment.js';

export interface CustomError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: CustomError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[Error] ${statusCode} - ${message}`);
  if (!config.isProduction && err.stack) {
    console.error(err.stack);
  }

  const payload = config.isProduction ? undefined : err.stack;
  sendError(res, message, statusCode, payload);
};
