import crypto from 'crypto';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { Response } from 'express';
import { User } from '../models/User.js';
import { StudentProfile, IStudentProfile } from '../models/StudentProfile.js';
import { config } from '../config/environment.js';
import { EmailService } from './email.service.js';

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  profile?: IStudentProfile | null;
  token: string;
}

export class AuthService {
  private static getJwtSecret(): Secret {
    return (config.jwtSecret || 'dev_jwt_secret_key_ud_diagnostic') as Secret;
  }

  /**
   * Generate JWT Token
   */
  public static generateToken(userId: string, role: string): string {
    const payload = { id: userId, role };
    const options: SignOptions = { expiresIn: '7d' };
    return jwt.sign(payload, this.getJwtSecret(), options);
  }

  /**
   * Attach HTTP-Only Auth Cookie to Response
   */
  public static setAuthCookie(res: Response, token: string): void {
    res.cookie('token', token, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  /**
   * Clear Auth Cookie
   */
  public static clearAuthCookie(res: Response): void {
    res.cookie('token', '', {
      httpOnly: true,
      expires: new Date(0),
    });
  }

  /**
   * Register User and create linked StudentProfile
   */
  public static async register(
    name: string,
    email: string,
    password?: string
  ): Promise<AuthResponse> {
    if (!name || !email || !password) {
      throw { statusCode: 400, message: 'Please provide name, email, and password' };
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw { statusCode: 400, message: 'Email address is already registered' };
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'student',
    });

    const profile = await StudentProfile.create({
      userId: user._id,
    });

    const token = this.generateToken(user._id.toString(), user.role);

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
      profile,
      token,
    };
  }

  /**
   * Login User
   */
  public static async login(email: string, password?: string): Promise<AuthResponse> {
    if (!email || !password) {
      throw { statusCode: 400, message: 'Please provide email and password' };
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      throw { statusCode: 401, message: 'Invalid credentials' };
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      throw { statusCode: 401, message: 'Invalid credentials' };
    }

    const profile = await StudentProfile.findOne({ userId: user._id });
    const token = this.generateToken(user._id.toString(), user.role);

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
      profile,
      token,
    };
  }

  /**
   * Request Password Reset Token & Send Email
   */
  public static async forgotPassword(email: string, originUrl: string): Promise<void> {
    if (!email) {
      throw { statusCode: 400, message: 'Please provide your email address' };
    }

    console.log(`[AuthService] Processing forgot password request for email: ${email}`);

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      console.warn(`⚠️ [AuthService] Password reset attempted for unregistered email: ${email}`);
      // Do not reveal if email exists for security, but return successfully
      return;
    }

    // Generate random 32-byte hex token
    const rawToken = crypto.randomBytes(32).toString('hex');

    // Hash token using sha256 before storing
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity

    await user.save({ validateBeforeSave: false });

    const resetUrl = `${originUrl}/reset-password?token=${rawToken}`;
    console.log(`[AuthService] Generated reset URL: ${resetUrl}`);
    await EmailService.sendPasswordResetEmail(user.email, resetUrl, user.name);
  }

  /**
   * Reset Password using raw token
   */
  public static async resetPassword(rawToken: string, newPassword?: string): Promise<void> {
    if (!rawToken || !newPassword) {
      throw { statusCode: 400, message: 'Invalid token or missing password' };
    }

    if (newPassword.length < 6) {
      throw { statusCode: 400, message: 'Password must be at least 6 characters long' };
    }

    // Hash raw token to compare against stored hash
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      throw { statusCode: 400, message: 'Password reset token is invalid or has expired' };
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();
  }
}
