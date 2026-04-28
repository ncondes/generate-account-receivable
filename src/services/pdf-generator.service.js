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
   * @param {Object} [options] - Optional extra rendering options (e.g. tools & subscriptions)
   * @returns {Promise<boolean>} True if successful
   */
  static async generatePDF(config, outputPath, invoiceData, options = {}) {
      try {
          const doc = new PDFDocument({
              size: 'A4',
              bufferPages: true,
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
          this.addContent(doc, config, invoiceData, options);

          // Add page numbers to all pages
          this.addPageNumbers(doc);

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
   * @param {Object} options - Optional extra rendering options
   */
  static addContent(doc, config, invoiceData, options = {}) {
      const todayDate = DateUtil.getTodayDate();
      const totalHours = invoiceData.totalHours;
      const calculatedAmount = invoiceData.calculatedAmount;
      const formattedAmount = invoiceData.formattedAmount;
      const amountInWords = invoiceData.amountInWords;
      const formattedHourlyRate = invoiceData.formattedHourlyRate;
      const hourlyRateInWords = invoiceData.hourlyRateInWords;

      doc.font('Helvetica').fontSize(12);

      this.addHeader(doc, config.location, todayDate);
      
      this.addCompanyInfo(doc, config.company);
      
      this.addPayableTo(doc, config.person);
      
      // Compute weekday days from summary if available
      const weekdayDays = invoiceData.summary
          ? (invoiceData.summary.workingDays - invoiceData.summary.weekendDays)
          : undefined;

      this.addAmountDue(doc, config.client, {
          formattedAmount,
          amountInWords,
          totalHours,
          periodStart: invoiceData.periodStart,
          periodEnd: invoiceData.periodEnd,
          formattedHourlyRate,
          hourlyRateInWords,
          weekendBilling: invoiceData.weekendBilling,
          weekdayDays,
          totals: invoiceData.totals
      });
      
      this.addPaymentInfo(doc, config.payment);

      this.addToolsAndSubscriptionsSection(doc, config.client, invoiceData, options.claudeSubscription);
      
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
         .moveDown(3);
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
         .moveDown(3);
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
         .text('Amount Due', { align: 'left' })
         .font('Helvetica')
         .text('Covering the period from ', { continued: true })
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
         .moveDown(1);

      const wb = amountData.weekendBilling;
      if (wb) {
          const formattedRegularAmount = NumberUtil.formatCurrency(wb.weekdayAmount);
          const formattedWeekendAmount = NumberUtil.formatCurrency(wb.weekendAmount);

          doc.font('Helvetica-Bold')
             .text('Breakdown:')
             .font('Helvetica');

          const weekdayLabel = typeof amountData.weekdayDays === 'number'
              ? `${amountData.weekdayDays} ${amountData.weekdayDays === 1 ? 'weekday' : 'weekdays'}`
              : 'weekdays';
          doc.text(`• ${wb.weekdayHours} hours × USD ${amountData.formattedHourlyRate} = USD ${formattedRegularAmount} — `, { continued: true })
             .text(weekdayLabel)

          if (wb.weekendHours > 0) {
              const weekendLabel = wb.weekendDays && wb.weekendDays > 0
                ? `${wb.weekendDays} ${wb.weekendDays === 1 ? 'weekend day' : 'weekend days'}`
                : 'weekends';
              doc.text(`• ${wb.weekendHours} hours × USD ${wb.formattedWeekendRate} = USD ${formattedWeekendAmount} — `, { continued: true })
                 .text(weekendLabel)
          }

          doc.moveDown(0.5);
      }

      const totals = amountData.totals || {};
      const servicesSubtotal = typeof totals.servicesSubtotal === 'number'
          ? NumberUtil.formatCurrency(totals.servicesSubtotal)
          : amountData.formattedAmount;
      const toolsSubtotal = typeof totals.toolsSubtotal === 'number'
          ? NumberUtil.formatCurrency(totals.toolsSubtotal)
          : null;
      const grandTotal = typeof totals.grandTotal === 'number'
          ? NumberUtil.formatCurrency(totals.grandTotal)
          : servicesSubtotal;

      doc.font('Helvetica-Bold')
         .text(`Services subtotal (excluding tools): USD ${servicesSubtotal}`);

      if (toolsSubtotal && totals.toolsSubtotal > 0) {
          doc.text(`Tools & subscriptions subtotal (see page 2): USD ${toolsSubtotal}`);
      }

      doc.moveDown(0.5)
         .text(`Total payable: USD ${grandTotal}`)
         .font('Helvetica')
         .text(`In words: ${amountData.amountInWords}`)
         .moveDown(2);
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
   * Add tools & subscriptions section (e.g. Claude Code PRO)
   * @param {PDFDocument} doc - PDF document instance
   * @param {Object} client - Client information
   * @param {Object} invoiceData - Invoice calculation data
   * @param {Object|null} claudeSubscription - Claude subscription metadata
   */
  static addToolsAndSubscriptionsSection(doc, client, invoiceData, claudeSubscription) {
      if (!claudeSubscription) {
          return;
      }

      doc.addPage();

      const formattedClaudeAmount = NumberUtil.formatCurrency(claudeSubscription.amount);
      const currencyCode = claudeSubscription.currency || 'USD';

      // Section heading
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('Tools & Subscriptions', { align: 'left' })
         .moveDown(0.5);

      doc.font('Helvetica');

      const clientName = claudeSubscription.clientName || client.name;

      doc
        .text(
          'In addition to the professional services detailed above, this invoice includes the reimbursement of a ',
          { continued: true }
        )
        .font('Helvetica-Bold')
        .text(claudeSubscription.toolName, { continued: true })
        .font('Helvetica')
        .text(' subscription used exclusively in the performance of development work for ', { continued: true })
        .font('Helvetica-Bold')
        .text(`${clientName}.`)
      .moveDown(0.5)
      .font('Helvetica')
      .text(
          'This subscription is a specialized developer productivity and code quality tool that supports the timely delivery and maintainability of the software solutions provided.'
      )
      .moveDown(0.5);

      doc
        .font('Helvetica-Bold')
        .text('The reimbursable amount for the ', { continued: true })
        .text(claudeSubscription.toolName, { continued: true })
        .font('Helvetica')
        .text(' subscription is ', { continued: true })
        .font('Helvetica-Bold')
        .text(`${currencyCode} ${formattedClaudeAmount}`, { continued: true })
        .font('Helvetica')
        .text(', which is included in the Total payable shown on page 1.')
      .moveDown(1.5);
  }

  static addPageNumbers(doc) {
      const range = doc.bufferedPageRange(); // { start, count }

      for (let i = range.start; i < range.start + range.count; i++) {
          doc.switchToPage(i);

          const pageNumber = i - range.start + 1;
          const totalPages = range.count;

          const oldBottomMargin = doc.page.margins.bottom;
          doc.page.margins.bottom = 0;

          doc.fontSize(9)
             .font('Helvetica')
             .text(
                 `Page ${pageNumber} of ${totalPages}`,
                 0,
                 doc.page.height - oldBottomMargin / 2,
                 {
                     align: 'center',
                     width: doc.page.width
                 }
             );

          doc.page.margins.bottom = oldBottomMargin;
      }
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