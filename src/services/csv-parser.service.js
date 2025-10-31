const fs = require('fs');
const path = require('path');
const LoggerService = require('./logger.service');

class CSVParserService {
  /**
   * Parse CSV file and extract time data
   * @param {string} csvPath - Path to CSV file
   * @returns {Object} Parsed data with total hours, period info, and daily entries
   */
  static parseCSV(csvPath) {
      try {
          if (!fs.existsSync(csvPath)) {
              throw new Error(`CSV file not found: ${csvPath}`);
          }

          const content = fs.readFileSync(csvPath, 'utf8');
          const lines = content.split('\n');
          
          // Find the header row (contains "Date,Ticket key,Summary,State,Hours worked")
          let headerIndex = -1;
          for (let i = 0; i < lines.length; i++) {
              if (lines[i].includes('Date,Ticket key,Summary,State,Hours worked')) {
                  headerIndex = i;
                  break;
              }
          }

          if (headerIndex === -1) {
              throw new Error('CSV file does not contain expected header format');
          }

          // Extract month and year from the CSV content
          const monthInfo = this.extractMonthInfo(lines);
          
          // Check for month mismatch between filename and CSV data
          this.checkMonthMismatch(csvPath, monthInfo);
          
          // Parse data rows
          const dataRows = lines.slice(headerIndex + 1);
          const dailyEntries = [];
          let totalHours = 0;

          for (const row of dataRows) {
              if (row.trim() === '') continue;
              
              const columns = this.parseCSVRow(row);
              if (columns.length >= 5) {
                  const date = columns[0];
                  const ticketKey = columns[1];
                  const summary = columns[2];
                  const state = columns[3];
                  const hoursWorked = parseFloat(columns[4]) || 0;

                  if (hoursWorked > 0) {
                      dailyEntries.push({
                          date,
                          ticketKey,
                          summary,
                          state,
                          hoursWorked
                      });
                      totalHours += hoursWorked;
                  }
              }
          }

          return {
              monthInfo,
              totalHours,
              dailyEntries,
              periodStart: monthInfo.periodStart,
              periodEnd: monthInfo.periodEnd
          };

      } catch (error) {
          LoggerService.error('Failed to parse CSV file');
          LoggerService.info('Please check that your CSV file has the correct format');
          throw error;
      }
  }

  /**
   * Extract month information from CSV content
   * @param {Array} lines - CSV lines
   * @returns {Object} Month information
   */
  static extractMonthInfo(lines) {
      // Look for "Month covered: [Month] [Year]" pattern
      for (const line of lines) {
          const monthMatch = line.match(/Month covered:\s*(\w+)\s+(\d{4})/i);
          if (monthMatch) {
              const monthName = monthMatch[1];
              const year = monthMatch[2];
              
              // Convert month name to number
              const monthNumber = this.getMonthNumber(monthName);
              if (monthNumber === -1) {
                  throw new Error(`Invalid month name: ${monthName}`);
              }

              // Calculate period start and end
              const periodStart = `${monthName} 1, ${year}`;
              const periodEnd = `${monthName} ${this.getDaysInMonth(monthNumber, parseInt(year))}, ${year}`;

              return {
                  month: monthName,
                  year: parseInt(year),
                  monthNumber,
                  periodStart,
                  periodEnd
              };
          }
      }

      throw new Error('Could not extract month information from CSV file');
  }

  /**
   * Parse a CSV row handling quoted values
   * @param {string} row - CSV row
   * @returns {Array} Parsed columns
   */
  static parseCSVRow(row) {
      const columns = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < row.length; i++) {
          const char = row[i];
          
          if (char === '"') {
              inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
              columns.push(current.trim());
              current = '';
          } else {
              current += char;
          }
      }
      
      columns.push(current.trim());
      return columns;
  }

  /**
   * Get month number from month name
   * @param {string} monthName - Month name
   * @returns {number} Month number (1-12) or -1 if invalid
   */
  static getMonthNumber(monthName) {
      const months = {
          'january': 1, 'february': 2, 'march': 3, 'april': 4,
          'may': 5, 'june': 6, 'july': 7, 'august': 8,
          'september': 9, 'october': 10, 'november': 11, 'december': 12
      };
      
      return months[monthName.toLowerCase()] || -1;
  }

  /**
   * Get number of days in a month
   * @param {number} month - Month number (1-12)
   * @param {number} year - Year
   * @returns {number} Number of days in the month
   */
  static getDaysInMonth(month, year) {
      return new Date(year, month, 0).getDate();
  }

  /**
   * Check for month mismatch between filename and CSV data
   * @param {string} csvPath - Path to CSV file
   * @param {Object} monthInfo - Month information from CSV
   */
  static checkMonthMismatch(csvPath, monthInfo) {
      try {
          const filename = path.basename(csvPath, '.csv');
          
          // Extract month from filename (look for month names)
          const monthNames = [
              'january', 'february', 'march', 'april', 'may', 'june',
              'july', 'august', 'september', 'october', 'november', 'december'
          ];
          
          let filenameMonth = null;
          for (const monthName of monthNames) {
              if (filename.toLowerCase().includes(monthName)) {
                  filenameMonth = this.getMonthNumber(monthName);
                  break;
              }
          }
          
          // If we found a month in the filename, check for mismatch
          if (filenameMonth && filenameMonth !== monthInfo.monthNumber) {
              const filenameMonthName = this.getMonthName(filenameMonth);
              const csvMonthName = monthInfo.month;
              
              // Calculate days difference
              const filenameDate = new Date(monthInfo.year, filenameMonth - 1, 1);
              const csvDate = new Date(monthInfo.year, monthInfo.monthNumber - 1, 1);
              const daysDifference = Math.abs((csvDate - filenameDate) / (1000 * 60 * 60 * 24));
              
              if (daysDifference > 30) {
                  LoggerService.warning('Month mismatch detected!');
                  LoggerService.warning(`Filename suggests: ${filenameMonthName} ${monthInfo.year}`);
                  LoggerService.warning(`CSV data shows: ${csvMonthName} ${monthInfo.year}`);
              }
          }
      } catch (error) {
          // Don't throw error for warning logic - just log if needed
          LoggerService.debug('Could not check month mismatch: ' + error.message);
      }
  }

  /**
   * Get month name from month number
   * @param {number} monthNumber - Month number (1-12)
   * @returns {string} Month name
   */
  static getMonthName(monthNumber) {
      const months = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return months[monthNumber - 1] || 'Unknown';
  }

  /**
   * Auto-detect CSV file in input folder
   * @param {string} inputFolder - Path to input folder
   * @returns {string|null} Path to CSV file or null if not found
   */
  static autoDetectCSV(inputFolder = 'input') {
      try {
          if (!fs.existsSync(inputFolder)) {
              return null;
          }

          const files = fs.readdirSync(inputFolder);
          const csvFiles = files.filter(file => file.toLowerCase().endsWith('.csv'));
          
          if (csvFiles.length === 0) {
              return null;
          }

          // Return the first CSV file found
          return path.join(inputFolder, csvFiles[0]);
      } catch (error) {
          LoggerService.error('Failed to auto-detect CSV file', error);
          return null;
      }
  }
}

module.exports = CSVParserService;
