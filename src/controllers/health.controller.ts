import { Request, Response } from 'express';
import { sendSuccess } from '../utils/apiResponse.js';

export const checkHealth = (_req: Request, res: Response): void => {
  sendSuccess(res, 'UD Diagnostic API is running');
};
