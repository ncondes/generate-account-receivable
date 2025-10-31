class LoggerService {
  // ANSI color codes
  static colors = {
      reset: '\x1b[0m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
      white: '\x1b[37m',
      gray: '\x1b[90m',
      bold: '\x1b[1m',
      dim: '\x1b[2m'
  };

  /**
   * Log an error message
   * @param {string} message - Error message
   * @param {Error} [error] - Optional error object
   */
  static error(message, error = null) {
      console.error(`${this.colors.red}✗ ERROR:${this.colors.reset}`, message);
      if (error && error.stack) {
          console.error(`${this.colors.gray}  Stack trace:${this.colors.reset}`, error.stack);
      }
  }

  /**
   * Log a success message
   * @param {string} message - Success message
   */
  static success(message) {
      // Split message into main part and additional info
      const parts = message.split(': ');
      if (parts.length > 1) {
          const mainMessage = parts[0];
          const additionalInfo = parts.slice(1).join(': ');
          console.log(`${this.colors.green}● ${mainMessage}${this.colors.reset}`);
          console.log(`${this.colors.white}  ${additionalInfo}${this.colors.reset}`);
      } else {
          console.log(`${this.colors.green}● ${message}${this.colors.reset}`);
      }
  }

  /**
   * Log an info message
   * @param {string} message - Info message
   */
  static info(message) {
      console.log(`${this.colors.blue}ℹ INFO:${this.colors.reset}`, message);
  }

  /**
   * Log a warning message
   * @param {string} message - Warning message
   */
  static warning(message) {
      console.log(`${this.colors.yellow}⚠ WARNING:${this.colors.reset} ${message}`);
  }

  /**
   * Log a debug message (only in development)
   * @param {string} message - Debug message
   */
  static debug(message) {
      if (process.env.NODE_ENV === 'development' || process.env.DEBUG) {
          console.log(`${this.colors.gray}🐛 DEBUG:${this.colors.reset}`, message);
      }
  }

  /**
   * Log a step in a process
   * @param {string} step - Step description
   * @param {string} [status] - Status (pending, completed, failed)
   */
  static step(step, status = 'pending') {
      const statusColors = {
          pending: this.colors.gray,
          completed: this.colors.green,
          failed: this.colors.red
      };
      
      const statusIcons = {
          pending: '○',
          completed: '●',
          failed: '✗'
      };

      const color = statusColors[status] || this.colors.gray;
      const icon = statusIcons[status] || '○';
      
      console.log(`${color}${icon} ${step}${this.colors.reset}`);
  }

  /**
   * Log a section header
   * @param {string} title - Section title
   */
  static section(title) {
      console.log('');
      console.log(`${this.colors.cyan}${this.colors.bold}📋 ${title.toUpperCase()}${this.colors.reset}`);
      console.log(`${this.colors.gray}${'─'.repeat(title.length + 4)}${this.colors.reset}`);
  }

  /**
   * Log a key-value pair
   * @param {string} key - Key name
   * @param {string|number} value - Value
   * @param {string} [color] - Optional color for the value
   */
  static keyValue(key, value, color = 'white') {
      const colorCode = this.colors[color] || this.colors.white;
      console.log(`  ${this.colors.gray}${key}:${this.colors.reset} ${colorCode}${value}${this.colors.reset}`);
  }

  /**
   * Log a summary with multiple key-value pairs
   * @param {Object} data - Object with key-value pairs
   * @param {string} [title] - Optional title for the summary
   */
  static summary(data, title = 'Summary') {
      this.section(title);
      Object.entries(data).forEach(([key, value]) => {
          this.keyValue(key, value);
      });
      console.log('');
  }

  /**
   * Log a progress indicator
   * @param {string} message - Progress message
   * @param {number} [current] - Current progress
   * @param {number} [total] - Total progress
   */
  static progress(message, current = null, total = null) {
      if (current !== null && total !== null) {
          const percentage = Math.round((current / total) * 100);
          console.log(`${this.colors.blue}⏳ ${message} (${current}/${total} - ${percentage}%)${this.colors.reset}`);
      } else {
          console.log(`${this.colors.blue}⏳ ${message}${this.colors.reset}`);
      }
  }

  /**
   * Clear the console
   */
  static clear() {
      console.clear();
  }

  /**
   * Log a separator line
   * @param {string} [char] - Character to use for separator
   * @param {number} [length] - Length of separator
   */
  static separator(char = '─', length = 50) {
      console.log(`${this.colors.gray}${char.repeat(length)}${this.colors.reset}`);
  }
}

module.exports = LoggerService;
