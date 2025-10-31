class NumberUtil {
  /**
   * Convert numbers to words
   * @param {number} num - The number to convert
   * @returns {string} The number in words
   */
  static numberToWords(num) {
      const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
      const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
      const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];

      if (num === 0) return 'zero';
      if (num < 10) return ones[num];
      if (num < 20) return teens[num - 10];
      if (num < 100) {
          return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? '-' + ones[num % 10] : '');
      }
      if (num < 1000) {
          return ones[Math.floor(num / 100)] + ' hundred' + (num % 100 !== 0 ? ' ' + this.numberToWords(num % 100) : '');
      }
      if (num < 1000000) {
          return this.numberToWords(Math.floor(num / 1000)) + ' thousand' + (num % 1000 !== 0 ? ' ' + this.numberToWords(num % 1000) : '');
      }
      if (num < 1000000000) {
          return this.numberToWords(Math.floor(num / 1000000)) + ' million' + (num % 1000000 !== 0 ? ' ' + this.numberToWords(num % 1000000) : '');
      }
      return this.numberToWords(Math.floor(num / 1000000000)) + ' billion' + (num % 1000000000 !== 0 ? ' ' + this.numberToWords(num % 1000000000) : '');
  }

  /**
   * Format currency amount with proper formatting
   * @param {number} amount - The amount to format
   * @returns {string} Formatted currency string
   */
  static formatCurrency(amount) {
      return new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
      }).format(amount);
  }

  /**
   * Convert amount to words with currency
   * @param {number} amount - The amount to convert
   * @returns {string} Amount in words with currency
   */
  static amountToWords(amount) {
      return this.numberToWords(Math.floor(amount)) + ' US dollars';
  }
}

module.exports = NumberUtil; 