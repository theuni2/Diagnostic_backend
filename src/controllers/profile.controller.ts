import { Request, Response, NextFunction } from 'express';
import { ProfileService } from '../services/profile.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw { statusCode: 401, message: 'Not authenticated' };
    }

    const profile = await ProfileService.getProfileByUserId(req.user.id);
    sendSuccess(res, 'Student profile fetched successfully', { profile });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw { statusCode: 401, message: 'Not authenticated' };
    }

    const profile = await ProfileService.updateProfile(req.user.id, req.body);
    sendSuccess(res, 'Student profile updated successfully', { profile });
  } catch (error) {
    next(error);
  }
};
