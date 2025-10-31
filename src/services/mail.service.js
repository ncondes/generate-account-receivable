const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const LoggerService = require('./logger.service');

class MailService {
  /**
   * Create email transporter using Gmail with app password
   * @returns {Object} Nodemailer transporter
   */
  static createTransporter() {
      const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
              user: process.env.MAILER_EMAIL,
              pass: process.env.MAILER_SECRET_KEY
          }
      });
      return transporter;
  }

  /**
   * Send PDF via email
   * @param {string} pdfPath - Path to the PDF file
   * @param {string} recipientEmail - Email address to send to
   * @param {string} clientName - Client name for the email subject
   * @param {Object} invoiceData - Invoice data containing period information
   * @param {Object} config - Configuration object containing user information
   * @returns {Promise<boolean>} True if successful
   */
  static async sendPDF(pdfPath, recipientEmail, clientName, invoiceData, config) {
      try {
          // Validate environment variables
          if (!process.env.MAILER_EMAIL || !process.env.MAILER_SECRET_KEY || !process.env.SENT_TO) {
              LoggerService.error('Missing email configuration. Please check your environment variables:');
              LoggerService.info('Required: MAILER_EMAIL, MAILER_SECRET_KEY, SENT_TO');
              LoggerService.info('Create a .env file in the project root with these variables');
              return false;
          }

          // Create transporter
          const transporter = this.createTransporter();

          // Verify transporter configuration
          await transporter.verify();
          LoggerService.info('Email configuration verified successfully');

          // Read PDF file
          if (!fs.existsSync(pdfPath)) {
              LoggerService.error(`PDF file not found: ${pdfPath}`);
              return false;
          }

          const pdfBuffer = fs.readFileSync(pdfPath);
          const filename = path.basename(pdfPath);

          // Generate month/year from invoice data
          const periodStart = new Date(invoiceData.periodStart);
          const monthYear = periodStart.toLocaleDateString('en-US', { 
              month: 'long', 
              year: 'numeric' 
          });

          // Email content
          const subject = `Account Receivable - ${monthYear} - ${clientName}`;
          const htmlContent = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #2c3e50;">
                  <h2 style="margin: 0 0 16px 0; font-weight: 700;">Account Receivable — ${monthYear}</h2>
                  
                  <p style="margin: 0 0 12px 0; color: #34495e; font-size: 16px;">Hi,</p>
                  
                  <p style="margin: 0 0 12px 0; color: #34495e;">I’m sharing the account receivable for <strong>${clientName}</strong> for <strong>${monthYear}</strong>. The attached PDF includes the total hours and amount due, along with payment details.</p>
                  
                  <div style="background: #ffffff; border: 1px solid #e6e8eb; border-radius: 10px; padding: 8px 16px; margin: 20px 0; box-shadow: 0 1px 2px rgba(0,0,0,0.03);">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; color: #495057;">
                          <tr>
                              <td style="padding: 10px 0; font-weight: 600; width: 40%;">Amount</td>
                              <td style="padding: 10px 0; text-align: right;">${invoiceData.formattedAmount}</td>
                          </tr>
                          <tr>
                              <td colspan="2" style="height: 1px; background: #f0f1f3;"></td>
                          </tr>
                          <tr>
                              <td style="padding: 10px 0; font-weight: 600;">Total hours</td>
                              <td style="padding: 10px 0; text-align: right;">${invoiceData.totalHours}</td>
                          </tr>
                          <tr>
                              <td colspan="2" style="height: 1px; background: #f0f1f3;"></td>
                          </tr>
                          <tr>
                              <td style="padding: 10px 0; font-weight: 600;">Period</td>
                              <td style="padding: 10px 0; text-align: right;">${invoiceData.periodStart} — ${invoiceData.periodEnd}</td>
                          </tr>
                      </table>
                  </div>
                  
                  <p style="margin: 0 0 12px 0; color: #34495e;">If anything looks off or you need any clarification, just reply here and I’ll be happy to help.</p>
                  
                  <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 13px;">Note: Bank and payment details are in the attached PDF.</p>
                  
                  <p style="margin: 16px 0 0 0; color: #2c3e50;">Best regards,<br>
                  <strong>${config.person.name}</strong></p>
              </div>
          `;

          // Email options
          const mailOptions = {
            from: process.env.MAILER_EMAIL,
            to: recipientEmail,
            subject: subject,
            html: htmlContent,
            attachments: [
              {
                filename: filename,
                content: pdfBuffer,
                contentType: 'application/pdf'
              }
            ]
          };

          // Send email
          LoggerService.step('Sending email', 'pending');
          await transporter.sendMail(mailOptions);
          
          LoggerService.success(`Email successfully sent to ${recipientEmail}`);
          
          return true;

      } catch (error) {
        LoggerService.error('Failed to send email', error);
        return false;
      }
  }

  /**
   * Send PDF to the configured recipient
   * @param {string} pdfPath - Path to the PDF file
   * @param {string} clientName - Client name
   * @param {Object} invoiceData - Invoice data containing period information
   * @param {Object} config - Configuration object containing user information
   * @returns {Promise<boolean>} True if successful
   */
  static async sendToRecipient(pdfPath, clientName, invoiceData, config) {
      const recipientEmail = process.env.SENT_TO;
      if (!recipientEmail) {
          LoggerService.error('SENT_TO environment variable is not set');
          return false;
      }

      return await this.sendPDF(pdfPath, recipientEmail, clientName, invoiceData, config);
  }
}

module.exports = MailService;
