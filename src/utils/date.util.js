class DateUtil {
  /**
   * Calculate work days between two dates (Monday to Friday)
   * @param {string} startDate - Start date string
   * @param {string} endDate - End date string
   * @returns {number} Number of work days
   */
  static calculateWorkDays(startDate, endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      let workDays = 0;
      const current = new Date(start);

      while (current <= end) {
          const dayOfWeek = current.getDay();
          if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = Sunday, 6 = Saturday
              workDays++;
          }
          current.setDate(current.getDate() + 1);
      }
      return workDays;
  }

  /**
   * Calculate total hours based on work days and hours per day
   * @param {string} startDate - Start date string
   * @param {string} endDate - End date string
   * @param {number} hoursPerDay - Hours worked per day (default: 8)
   * @returns {number} Total hours worked
   */
  static calculateTotalHours(startDate, endDate, hoursPerDay = 8) {
      const workDays = this.calculateWorkDays(startDate, endDate);
      return workDays * hoursPerDay;
  }

  /**
   * Get today's date in the required format
   * @returns {string} Formatted date string
   */
  static getTodayDate() {
      const today = new Date();
      const months = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const month = months[today.getMonth()];
      const day = today.getDate();
      const year = today.getFullYear();
      return `${month} ${day}, ${year}`;
  }

  /**
   * Generate filename based on period dates
   * @param {string} startDate - Start date string
   * @param {string} endDate - End date string
   * @returns {string} Generated filename
   */
  static generateFilename(startDate, endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const months = [
          'january', 'february', 'march', 'april', 'may', 'june',
          'july', 'august', 'september', 'october', 'november', 'december'
      ];
      
      const startMonth = months[start.getMonth()];
      const startYear = start.getFullYear();
      const endMonth = months[end.getMonth()];
      const endYear = end.getFullYear();
      
      // If same month and year, use single month format
      if (startMonth === endMonth && startYear === endYear) {
          return `account_receivable_${startMonth}_${startYear}.pdf`;
      }
      
      // If different months but same year
      if (startYear === endYear) {
          return `account_receivable_${startMonth}_to_${endMonth}_${startYear}.pdf`;
      }
      
      // If different years
      return `account_receivable_${startMonth}_${startYear}_to_${endMonth}_${endYear}.pdf`;
  }
}

module.exports = DateUtil; 