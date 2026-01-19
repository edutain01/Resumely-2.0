import nodemailer from 'nodemailer';

// Create transporter
const createTransporter = () => {
  // For development, use Gmail SMTP or other email service
  // You can configure this via environment variables
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || process.env.EMAIL_USER,
      pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
    },
  });

  return transporter;
};

/**
 * Send OTP email to user
 * @param {string} email - Recipient email
 * @param {string} otpCode - OTP code to send
 * @returns {Promise<Object>} - Email send result
 */
export const sendOTPEmail = async (email, otpCode) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || `"Resumly" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email - Resumly',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0ea5e9 0%, #7dd3fc 50%, #f97316 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Resumly</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Email Verification</h2>
            <p>Thank you for registering with Resumly! Please verify your email address by entering the OTP code below:</p>
            <div style="background: white; border: 2px dashed #0ea5e9; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <p style="font-size: 14px; color: #666; margin: 0 0 10px 0;">Your verification code is:</p>
              <h1 style="color: #0ea5e9; font-size: 36px; letter-spacing: 8px; margin: 0; font-weight: bold;">${otpCode}</h1>
            </div>
            <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">If you didn't create an account with Resumly, please ignore this email.</p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>&copy; ${new Date().getFullYear()} Resumly. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
      text: `
        Email Verification - Resumly
        
        Thank you for registering with Resumly! Please verify your email address by entering the OTP code below:
        
        Your verification code is: ${otpCode}
        
        This code will expire in 10 minutes.
        
        If you didn't create an account with Resumly, please ignore this email.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
};

/**
 * Verify email transporter configuration
 * @returns {Promise<boolean>} - Whether email service is configured
 */
export const verifyEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
};


