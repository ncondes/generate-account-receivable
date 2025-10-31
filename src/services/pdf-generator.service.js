const fs = require('fs');
const PDFDocument = require('pdfkit');
const LoggerService = require('./logger.service');
const { NumberUtil, DateUtil } = require('../utils');

class PDFGeneratorService {
  /**
   * Generate PDF document
   * @param {Object} config - Configuration object
   * @param {string} outputPath - Output file path
   * @param {Object} invoiceData - Invoice calculation data
   * @returns {Promise<boolean>} True if successful
   */
  static async generatePDF(config, outputPath, invoiceData) {
      try {
          const doc = new PDFDocument({
              size: 'A4',
              margins: {
                  top: 60,
                  bottom: 60,
                  left: 60,
                  right: 60
              }
          });

          // Pipe PDF to file
          const stream = fs.createWriteStream(outputPath);
          doc.pipe(stream);

          // Add content to PDF
          this.addContent(doc, config, invoiceData);

          // Finalize PDF
          doc.end();

          return new Promise((resolve, reject) => {
              stream.on('finish', () => {
                  resolve(true);
              });
              stream.on('error', (error) => {
                  LoggerService.error('Failed to generate PDF', error);
                  reject(error);
              });
          });

      } catch (error) {
          LoggerService.error('Failed to create PDF', error);
          throw error;
      }
  }

  /**
   * Add content to the PDF document
   * @param {PDFDocument} doc - PDF document instance
   * @param {Object} config - Configuration object
   * @param {Object} invoiceData - Invoice calculation data
   */
  static addContent(doc, config, invoiceData) {
      // Use pre-calculated values from invoice data
      const todayDate = DateUtil.getTodayDate();
      const totalHours = invoiceData.totalHours;
      const calculatedAmount = invoiceData.calculatedAmount;
      const formattedAmount = invoiceData.formattedAmount;
      const amountInWords = invoiceData.amountInWords;
      const formattedHourlyRate = invoiceData.formattedHourlyRate;
      const hourlyRateInWords = invoiceData.hourlyRateInWords;

      // Set default font and add some professional spacing
      doc.font('Helvetica').fontSize(12);

      // Add header
      this.addHeader(doc, config.location, todayDate);
      
      // Add company information
      this.addCompanyInfo(doc, config.company);
      
      // Add payable to section
      this.addPayableTo(doc, config.person);
      
      // Add amount due section
      this.addAmountDue(doc, config.client, {
          formattedAmount,
          amountInWords,
          totalHours,
          periodStart: invoiceData.periodStart,
          periodEnd: invoiceData.periodEnd,
          formattedHourlyRate,
          hourlyRateInWords
      });
      
      // Add payment information
      this.addPaymentInfo(doc, config.payment);
      
      // Add signature section
      this.addSignature(doc, config.person);
  }

  /**
   * Add header section
   * @param {PDFDocument} doc - PDF document instance
   * @param {string} location - Location
   * @param {string} date - Date
   */
  static addHeader(doc, location, date) {
      doc.fontSize(12)
         .font('Helvetica')
         .text(`${location}, ${date}`, { align: 'left' })
         .moveDown(4);
  }

  /**
   * Add company information section
   * @param {PDFDocument} doc - PDF document instance
   * @param {Object} company - Company information
   */
  static addCompanyInfo(doc, company) {
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text(company.name, { align: 'center' })
         .fontSize(12)
         .font('Helvetica')
         .text(`Registration number (${company.registrationCountry}): ${company.registrationNumber}`, { align: 'center' })
         .text(`Address: ${company.address}`, { align: 'center' })
         .moveDown(4);
  }

  /**
   * Add payable to section
   * @param {PDFDocument} doc - PDF document instance
   * @param {Object} person - Person information
   */
  static addPayableTo(doc, person) {
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('PAYABLE TO:', { align: 'center' })
         .fontSize(12)
         .font('Helvetica')
         .text(person.name, { align: 'center' })
         .text(`CC ${person.identification}`, { align: 'center' })
         .moveDown(3);
         
  }

  /**
   * Add amount due section
   * @param {PDFDocument} doc - PDF document instance
   * @param {Object} amountData - Amount data
   */
  static addAmountDue(doc, client, amountData) {
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('Amount Due: ', { align: 'left', continued: true })
         .text('USD ', { continued: true })
         .text(`${amountData.formattedAmount}`, { continued: true })
         .font('Helvetica')
         .text(` (${amountData.amountInWords})`, { align: 'left' })
         .text('Corresponding to ', { continued: true })
         .font('Helvetica-Bold')
         .text(`${amountData.totalHours} hours`, { continued: true })
         .font('Helvetica')
         .text(' worked between ', { continued: true })
         .font('Helvetica-Bold')
         .text(`${amountData.periodStart}`, { continued: true })
         .font('Helvetica')
         .text(' and ', { continued: true })
         .font('Helvetica-Bold')
         .text(`${amountData.periodEnd}`, { continued: true })
         .font('Helvetica')
         .text(' for professional services provided to ', { continued: true })
         .font('Helvetica-Bold')
         .text(`${client.name}`, { continued: true })
         .font('Helvetica')
         .text('.')
         .moveDown(1)
         .font('Helvetica-Bold')
         .text('Hourly Rate: ', { continued: true })
         .text('USD ', { continued: true })
         .text(`${amountData.formattedHourlyRate}`, { continued: true })
         .font('Helvetica')
         .text(` (${amountData.hourlyRateInWords}).`)
         .moveDown(3);
  }

  /**
   * Add payment information section
   * @param {PDFDocument} doc - PDF document instance
   * @param {Object} payment - Payment information
   */
  static addPaymentInfo(doc, payment) {
      doc.fontSize(12)
         .font('Helvetica')
         .text('Payment should be made to the following account:', { align: 'left' })
         .moveDown(1)
         .font('Helvetica-Bold')
         .text('Account holder name: ', { continued: true })
         .font('Helvetica')
         .text(payment.accountHolder)
         .font('Helvetica-Bold')
         .text('Account number: ', { continued: true })
         .font('Helvetica')
         .text(payment.accountNumber)
         .font('Helvetica-Bold')
         .text('Account type: ', { continued: true })
         .font('Helvetica')
         .text(payment.accountType)
         .font('Helvetica-Bold')
         .text('Routing number: ', { continued: true })
         .font('Helvetica')
         .text(payment.routingNumber)
         .font('Helvetica-Bold')
         .text('Bank Name: ', { continued: true })
         .font('Helvetica')
         .text(payment.bankName)
         .font('Helvetica-Bold')
         .text('Bank Address: ', { continued: true })
         .font('Helvetica')
         .text(payment.bankAddress)
         .moveDown(4);
  }

  /**
   * Add signature section
   * @param {PDFDocument} doc - PDF document instance
   * @param {Object} person - Person information
   */
  static addSignature(doc, person) {
      doc.fontSize(12)
         .font('Helvetica')
         .text('Sincerely,', { align: 'left' })
         .moveDown(3)
         .font('Helvetica-Bold')
         .text(person.name)
         .font('Helvetica')
         .text(`C.C. ${person.identification}`);
  }
}

module.exports = PDFGeneratorService; 