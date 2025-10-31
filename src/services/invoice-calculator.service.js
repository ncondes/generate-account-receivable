const CSVParserService = require('./csv-parser.service');
const LoggerService = require('./logger.service');
const { NumberUtil } = require('../utils');

class InvoiceCalculatorService {
  /**
   * Check if a date is a weekend (Saturday or Sunday)
   * @param {string} dateString - Date string in various formats
   * @returns {boolean} True if weekend, false otherwise
   */
  static isWeekend(dateString) {
      try {
          let date;
          
          // Handle YY-MM-DD format (e.g., '25-10-06')
          if (dateString.match(/^\d{2}-\d{2}-\d{2}$/)) {
              const [year, month, day] = dateString.split('-');
              // Convert 2-digit year to 4-digit (assuming 20xx for years 00-99)
              const fullYear = parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year);
              date = new Date(fullYear, parseInt(month) - 1, parseInt(day));
          }
          // Handle other date formats
          else {
              date = new Date(dateString);
          }
          
          // Check if date is valid
          if (isNaN(date.getTime())) {
              LoggerService.warning(`Invalid date format: ${dateString}`);
              return false;
          }
          
          const dayOfWeek = date.getDay();
          return dayOfWeek === 0 || dayOfWeek === 6; // 0 = Sunday, 6 = Saturday

      } catch (error) {
          LoggerService.warning(`Could not parse date: ${dateString}`);
          return false;
      }
  }

  /**
   * Calculate invoice data from CSV file with weekend double billing
   * @param {string} csvPath - Path to CSV file
   * @param {number} hourlyRate - Hourly rate
   * @returns {Object} Invoice calculation data
   */
  static calculateInvoice(csvPath, hourlyRate) {
      try {
          // Parse CSV data
          const csvData = CSVParserService.parseCSV(csvPath);
          
          // Calculate invoice amounts with weekend double billing
          let regularHours = 0;
          let weekendHours = 0;
          let weekendDays = 0;
          
          // Process each daily entry to separate regular and weekend hours
          for (const entry of csvData.dailyEntries) {
              if (this.isWeekend(entry.date)) {
                  weekendHours += entry.hoursWorked;
                  weekendDays++;
              } else {
                  regularHours += entry.hoursWorked;
              }
          }
          
          // Calculate amounts: regular hours at normal rate, weekend hours at 2x rate
          const regularAmount = Math.ceil(hourlyRate * regularHours);
          const weekendAmount = Math.ceil(hourlyRate * 2 * weekendHours);
          const calculatedAmount = regularAmount + weekendAmount;
          
          const formattedAmount = NumberUtil.formatCurrency(calculatedAmount);
          const amountInWords = NumberUtil.amountToWords(calculatedAmount);
          const formattedHourlyRate = NumberUtil.formatCurrency(hourlyRate);
          const hourlyRateInWords = NumberUtil.amountToWords(hourlyRate);

          return {
              // CSV data
              ...csvData,
              
              // Calculated amounts
              calculatedAmount,
              formattedAmount,
              amountInWords,
              formattedHourlyRate,
              hourlyRateInWords,
              
              // Weekend billing details
              weekendBilling: {
                  regularHours,
                  weekendHours,
                  weekendDays,
                  regularAmount,
                  weekendAmount,
                  weekendRate: hourlyRate * 2,
                  formattedWeekendRate: NumberUtil.formatCurrency(hourlyRate * 2)
              },
              
              // Summary for logging
              summary: {
                  workingDays: csvData.dailyEntries.length,
                  totalHours: csvData.totalHours,
                  regularHours,
                  weekendHours,
                  weekendDays,
                  periodStart: csvData.periodStart,
                  periodEnd: csvData.periodEnd,
                  hourlyRate,
                  calculatedAmount,
                  formattedAmount,
                  regularAmount,
                  weekendAmount
              }
          };

      } catch (error) {
          LoggerService.error('Failed to calculate invoice', error);
          throw error;
      }
  }

  /**
   * Auto-detect and calculate invoice from CSV in input folder
   * @param {string} inputFolder - Path to input folder
   * @param {number} hourlyRate - Hourly rate
   * @returns {Object} Invoice calculation data
   */
  static autoCalculateInvoice(inputFolder = 'input', hourlyRate) {
      try {
          // Auto-detect CSV file
          const csvPath = CSVParserService.autoDetectCSV(inputFolder);
          if (!csvPath) {
              LoggerService.error('No CSV file found in input folder');
              LoggerService.info('Please place your time report CSV file in the input/ directory');
              throw new Error('No CSV file found');
          }

          LoggerService.info(`Auto-detected CSV file: ${csvPath}`);
          
          // Calculate invoice
          return this.calculateInvoice(csvPath, hourlyRate);

      } catch (error) {
          // Re-throw to let main application handle other errors
          throw error;
      }
  }

}

module.exports = InvoiceCalculatorService;
