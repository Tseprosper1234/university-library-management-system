const axios = require('axios');

class EmailService {
  constructor() {
    this.apiKey = process.env.BREVO_API_KEY;
    this.senderEmail = process.env.BREVO_SENDER_EMAIL;
    this.baseURL = 'https://api.brevo.com/v3';
  }

  initialize() {
    if (!this.apiKey) {
      console.error('BREVO_API_KEY is not configured');
    } else {
      console.log('Email service initialized with Brevo API');
    }
  }

  async sendEmail({ to, subject, htmlContent, textContent }) {
    try {
      const response = await axios.post(
        `${this.baseURL}/smtp/email`,
        {
          sender: { 
            name: 'University Library', 
            email: this.senderEmail 
          },
          to: [{ email: to }],
          subject,
          htmlContent,
          textContent
        },
        {
          headers: {
            'api-key': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Email sent successfully:', response.data.messageId);
      return { success: true, messageId: response.data.messageId };
    } catch (error) {
      console.error('Error sending email:', error.response?.data || error.message);
      return { success: false, error: error.message };
    }
  }

  async sendVerificationEmail(email, token) {
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    
    return this.sendEmail({
      to: email,
      subject: 'Verify Your Email - University Library',
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            .container { max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; }
            .header { background: #1a73e8; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
            .button { display: inline-block; padding: 12px 24px; background: #1a73e8; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to University Library</h1>
            </div>
            <div class="content">
              <h2>Email Verification Required</h2>
              <p>Thank you for registering! Please verify your email address by clicking the button below:</p>
              <a href="${verificationLink}" class="button">Verify Email Address</a>
              <p>Or copy and paste this link in your browser:</p>
              <p>${verificationLink}</p>
              <p>This link will expire in 24 hours.</p>
              <p>If you did not create this account, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 University Library. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      textContent: `Welcome to University Library! Please verify your email by clicking: ${verificationLink}`
    });
  }

  async sendBorrowConfirmation(email, bookTitle, dueDate) {
    return this.sendEmail({
      to: email,
      subject: `Book Borrowed: ${bookTitle} - University Library`,
      htmlContent: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: #4CAF50; color: white; padding: 20px; text-align: center;">
            <h2>Book Borrowed Successfully</h2>
          </div>
          <div style="padding: 20px; background: #f9f9f9;">
            <h3>Book Details:</h3>
            <p><strong>Title:</strong> ${bookTitle}</p>
            <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
            <p>Please return the book by the due date to avoid late fees.</p>
            <p><strong>Late Fee:</strong> $0.50 per day after due date</p>
            <p style="margin-top: 20px; color: #666;">Thank you for using University Library!</p>
          </div>
        </div>
      `,
      textContent: `Book "${bookTitle}" has been borrowed successfully. Due Date: ${new Date(dueDate).toLocaleDateString()}. Please return by due date to avoid late fees of $0.50 per day.`
    });
  }

  async sendOverdueReminder(email, bookTitle, daysOverdue, fineAmount) {
    return this.sendEmail({
      to: email,
      subject: `URGENT: Overdue Book Reminder - University Library`,
      htmlContent: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: #f44336; color: white; padding: 20px; text-align: center;">
            <h2>Overdue Book Notice</h2>
          </div>
          <div style="padding: 20px; background: #fff3f3;">
            <h3>Overdue Details:</h3>
            <p><strong>Book Title:</strong> ${bookTitle}</p>
            <p><strong>Days Overdue:</strong> ${daysOverdue}</p>
            <p><strong>Fine Amount:</strong> $${fineAmount.toFixed(2)}</p>
            <p>Please return the book immediately to stop further fines from accruing.</p>
            <p style="margin-top: 20px; color: #f44336; font-weight: bold;">Action Required: Return this book as soon as possible!</p>
          </div>
        </div>
      `,
      textContent: `OVERDUE BOOK: "${bookTitle}" is ${daysOverdue} days overdue. Fine: $${fineAmount.toFixed(2)}. Please return immediately to avoid additional charges.`
    });
  }

  async sendReservationAvailable(email, bookTitle) {
    return this.sendEmail({
      to: email,
      subject: `Reserved Book Available: ${bookTitle} - University Library`,
      htmlContent: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: #2196F3; color: white; padding: 20px; text-align: center;">
            <h2>Your Reserved Book is Available!</h2>
          </div>
          <div style="padding: 20px; background: #f9f9f9;">
            <h3>Book Details:</h3>
            <p><strong>Title:</strong> ${bookTitle}</p>
            <p>The book you reserved is now available for pickup.</p>
            <p>Please visit the library within 48 hours to borrow this book.</p>
            <p style="margin-top: 20px; color: #666;">After 48 hours, the reservation will be cancelled.</p>
          </div>
        </div>
      `,
      textContent: `The book "${bookTitle}" you reserved is now available. Please visit the library within 48 hours to borrow it.`
    });
  }

  async sendPasswordResetEmail(email, token) {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    return this.sendEmail({
      to: email,
      subject: 'Password Reset Request - University Library',
      htmlContent: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: #FF9800; color: white; padding: 20px; text-align: center;">
            <h2>Password Reset Request</h2>
          </div>
          <div style="padding: 20px; background: #f9f9f9;">
            <p>You requested a password reset. Click the button below to reset your password:</p>
            <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background: #FF9800; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Reset Password</a>
            <p>Or copy and paste this link: ${resetLink}</p>
            <p>This link will expire in 1 hour.</p>
            <p style="color: #f44336;">If you didn't request this, please ignore this email.</p>
          </div>
        </div>
      `,
      textContent: `Password Reset Request. Click this link to reset your password: ${resetLink}. This link expires in 1 hour.`
    });
  }
}

module.exports = new EmailService();