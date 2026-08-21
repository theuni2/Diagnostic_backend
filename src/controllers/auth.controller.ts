import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { ProfileService } from '../services/profile.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    const authData = await AuthService.register(name, email, password);

    AuthService.setAuthCookie(res, authData.token);

    sendSuccess(
      res,
      'User registered successfully',
      {
        user: authData.user,
        profile: authData.profile,
        token: authData.token,
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;
    const authData = await AuthService.login(email, password);

    AuthService.setAuthCookie(res, authData.token);

    sendSuccess(res, 'Logged in successfully', {
      user: authData.user,
      profile: authData.profile,
      token: authData.token,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = (_req: Request, res: Response): void => {
  AuthService.clearAuthCookie(res);
  sendSuccess(res, 'Logged out successfully');
};

export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw { statusCode: 401, message: 'Not authenticated' };
    }
    const profile = await ProfileService.getProfileByUserId(req.user.id);
    sendSuccess(res, 'User authenticated', {
      user: req.user,
      profile,
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;
    const origin = req.headers.origin || `${req.protocol}://${req.get('host')}`;
    await AuthService.forgotPassword(email, origin);

    sendSuccess(res, 'If your email is registered, a password reset link has been sent');
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token, password } = req.body;
    await AuthService.resetPassword(token, password);

    sendSuccess(res, 'Password reset successful. You can now log in with your new password');
  } catch (error) {
    next(error);
  }
};
