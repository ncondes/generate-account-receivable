const fs = require('fs');
const LoggerService = require('./logger.service');
const { ConfigValidatorUtil } = require('../utils');

class ConfigService {
  /**
   * Load configuration from JSON file
   * @param {string} configPath - Path to configuration file
   * @returns {Object|null} Configuration object or null if failed
   */
  static loadConfig(configPath) {
      try {
          const configData = fs.readFileSync(configPath, 'utf8');
          const config = JSON.parse(configData);
          return config;
      } catch (error) {
          LoggerService.error('Failed to load configuration', error);
          return null;
      }
  }

  /**
   * Validate configuration
   * @param {Object} config - Configuration object to validate
   * @returns {boolean} True if valid
   */
  static validateConfig(config) {
      return ConfigValidatorUtil.validate(config);
  }
}

module.exports = ConfigService; 