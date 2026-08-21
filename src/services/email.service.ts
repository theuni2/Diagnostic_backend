import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { config } from '../config/environment.js';

export interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export class EmailService {
  private static transporter: Transporter | null = null;

  /**
   * Lazy-initialize or return existing SMTP Transporter
   */
  private static getTransporter(): Transporter | null {
    if (this.transporter) {
      return this.transporter;
    }

    if (!config.email.smtpUser || !config.email.smtpPass) {
      console.warn(
        '⚠️ [EmailService] SMTP credentials missing (SMTP_USER / SMTP_PASS). Falling back to console provider.'
      );
      return null;
    }

    this.transporter = nodemailer.createTransport({
      host: config.email.smtpHost,
      port: config.email.smtpPort,
      secure: config.email.smtpSecure,
      auth: {
        user: config.email.smtpUser,
        pass: config.email.smtpPass,
      },
    });

    return this.transporter;
  }

  /**
   * Print email contents to console for local development fallback
   */
  private static logToConsole(options: SendEmailOptions): boolean {
    console.log('\n---------------- EMAIL SERVICE (CONSOLE PROVIDER) ----------------');
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Body (Text):\n${options.text}`);
    console.log('------------------------------------------------------------------\n');
    return true;
  }

  /**
   * Send generic email using configured provider abstraction
   */
  public static async sendEmail(options: SendEmailOptions): Promise<boolean> {
    const provider = (config.email.provider || process.env.EMAIL_PROVIDER || 'console').toLowerCase();

    if (provider === 'smtp' || provider === 'nodemailer' || config.email.smtpUser) {
      try {
        const transporter = this.getTransporter();
        if (!transporter) {
          return this.logToConsole(options);
        }

        const info = await transporter.sendMail({
          from: config.email.from || '"UD Diagnostic AI" <unidiscoveryfiles@gmail.com>',
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html,
        });

        console.log(`✅ [EmailService] Email sent successfully to ${options.to} (MessageId: ${info.messageId})`);
        return true;
      } catch (error) {
        console.error('❌ [EmailService] Failed to send email via SMTP:', error);
        // Fallback log to console if SMTP fails so reset token is never lost
        this.logToConsole(options);
        return false;
      }
    }

    return this.logToConsole(options);
  }

  /**
   * Send Password Reset Email with time-limited token URL
   */
  public static async sendPasswordResetEmail(
    to: string,
    resetUrl: string,
    userName: string
  ): Promise<boolean> {
    const subject = 'UD Diagnostic AI — Password Reset Request';
    const text = `Hello ${userName},\n\nYou requested a password reset for your UD Diagnostic AI account.\nPlease click the link below or paste it into your browser to reset your password:\n\n${resetUrl}\n\nThis link is valid for 1 hour.\nIf you did not request this, please ignore this email.`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #0284c7;">UD Diagnostic AI — Password Reset</h2>
        <p>Hello <strong>${userName}</strong>,</p>
        <p>You requested a password reset for your UD Diagnostic AI account.</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background-color: #0284c7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Reset Password</a>
        </p>
        <p>Or copy and paste this URL into your browser:</p>
        <p style="word-break: break-all;"><a href="${resetUrl}">${resetUrl}</a></p>
        <p style="color: #64748b; font-size: 12px; margin-top: 24px;"><em>This link is valid for 1 hour. If you did not request this email, please ignore it.</em></p>
      </div>
    `;

    return this.sendEmail({ to, subject, text, html });
  }
}
