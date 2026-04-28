require('dotenv').config();

const ConfigService = require('./services/config.service');
const PDFGeneratorService = require('./services/pdf-generator.service');
const InvoiceCalculatorService = require('./services/invoice-calculator.service');
const MailService = require('./services/mail.service');
const LoggerService = require('./services/logger.service');
const { DateUtil } = require('./utils');
const readline = require('readline');

/**
 * Main function to generate account receivable PDF
 * @returns {Promise<boolean>} True if successful
 */
async function generateAccountReceivable() {
  try {
      LoggerService.section('Account Receivable Generator');
      
      LoggerService.step('Loading configuration', 'pending');
      const config = ConfigService.loadConfig('config.json');
      if (!config) {
          throw new Error('Failed to load configuration');
      }
      LoggerService.step('Configuration loaded', 'completed');

      LoggerService.step('Validating configuration', 'pending');
      if (!ConfigService.validateConfig(config)) {
          throw new Error('Configuration validation failed');
      }
      LoggerService.step('Configuration validated', 'completed');

      LoggerService.step('Calculating invoice data', 'pending');
      const invoiceData = InvoiceCalculatorService.autoCalculateInvoice('input', config.amount.hourlyRate);
      LoggerService.step('Invoice data calculated', 'completed');

      // Compute subtotals and grand total
      const servicesSubtotal = invoiceData.calculatedAmount;
      const includeClaudeSubscription = !!(config.claude && config.claude.enabled);
      const toolsSubtotal = includeClaudeSubscription && typeof config.claude.amount === 'number'
          ? config.claude.amount
          : 0;
      const grandTotal = servicesSubtotal + toolsSubtotal;

      invoiceData.totals = {
          servicesSubtotal,
          toolsSubtotal,
          grandTotal
      };

      const summaryData = {
          'Working Days': invoiceData.summary.workingDays,
          'Total Hours': invoiceData.summary.totalHours,
          'Period': `${invoiceData.summary.periodStart} to ${invoiceData.summary.periodEnd}`,
          'Hourly Rate': `$${invoiceData.summary.hourlyRate}`,
          'Services Subtotal': `$${servicesSubtotal}`,
          'Tools & Subscriptions': `$${toolsSubtotal}`,
          'Total Payable': `$${grandTotal}`
      };

      if (invoiceData.summary.weekendHours > 0) {
          summaryData['Weekday Hours'] = `${invoiceData.summary.weekdayHours}h`;
          summaryData['Weekend Hours'] = `${invoiceData.summary.weekendHours}h (${invoiceData.summary.weekendDays} days)`;
          summaryData['Weekend Rate'] = `$${invoiceData.summary.hourlyRate * 2}/hour`;
          summaryData['Weekday Amount'] = `$${invoiceData.summary.weekdayAmount}`;
          summaryData['Weekend Amount'] = `$${invoiceData.summary.weekendAmount}`;
          summaryData['Total Amount'] = `$${invoiceData.summary.calculatedAmount}`;
      }

      LoggerService.summary(summaryData, 'Invoice Summary');

      const filename = DateUtil.generateFilename(invoiceData.periodStart, invoiceData.periodEnd);
      const outputPath = `output/${filename}`;

      LoggerService.info(`Output file: ${outputPath}`);

      const claudeSubscription = includeClaudeSubscription
          ? {
              toolName: config.claude.name || 'Claude Code PRO',
              amount: config.claude.amount,
              currency: config.claude.currency || 'USD',
              periodStart: invoiceData.periodStart,
              periodEnd: invoiceData.periodEnd,
              clientName: config.client.name
          }
          : null;

      LoggerService.step('Generating PDF document', 'pending');
      await PDFGeneratorService.generatePDF(config, outputPath, invoiceData, {
          claudeSubscription
      });
      LoggerService.step('PDF document generated', 'completed');
      
      return { success: true, outputPath, clientName: config.client.name, invoiceData, config };

  } catch (error) {
      // Specific errors are handled in their respective services
      // Only handle unexpected errors here
      if (!error.message.includes('No CSV file found') && !error.message.includes('Failed to parse CSV')) {
          LoggerService.error('Failed to generate account receivable document', error);
      }
      return { success: false };
  }
}

/**
 * CLI entry point
 */
async function main() {
  // Validate config file exists
  if (!require('fs').existsSync('config.json')) {
      LoggerService.error('Configuration file not found: config.json');
      LoggerService.info('Please ensure config.json exists in the project root');
      process.exit(1);
  }

  const result = await generateAccountReceivable();
  
  if (result.success) {
      // Show email prompt
      await showEmailPrompt(result.outputPath, result.clientName, result.invoiceData, result.config);
  }
  
  process.exit(result.success ? 0 : 1);
}

/**
 * Show email prompt to user
 * @param {string} outputPath - Path to the generated PDF
 * @param {string} clientName - Client name
 * @param {Object} invoiceData - Invoice data containing period information
 * @param {Object} config - Configuration object containing user information
 */
async function showEmailPrompt(outputPath, clientName, invoiceData, config) {
  const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
  });

  return new Promise((resolve) => {
      LoggerService.section('Email Options');
      LoggerService.info('PDF generated successfully!');
      LoggerService.info('Type "send" to email the PDF, or press Enter to exit');
      
      rl.question('> ', async (input) => {
          rl.close();
          
          if (input.toLowerCase().trim() === 'send') {
              LoggerService.section('Sending Email');
              const emailSent = await MailService.sendToRecipient(outputPath, clientName, invoiceData, config);
              if (!emailSent) {
                  LoggerService.error('Failed to send email');
              }
          } else {
              LoggerService.info('Exiting without sending email');
          }
          
          resolve();
      });
  });
}

// Export for use as module
module.exports = {
  generateAccountReceivable,
  ConfigService,
  PDFGeneratorService
};

// Run if called directly
if (require.main === module) {
  main();
} 