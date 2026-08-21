import { Request, Response } from 'express';
import { sendError } from '../utils/apiResponse.js';

export const notFoundHandler = (req: Request, res: Response): void => {
  sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
};
