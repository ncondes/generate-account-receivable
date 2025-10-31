const LoggerService = require('../services/logger.service');

class ConfigValidatorUtil {
  /**
   * Validate configuration object
   * @param {Object} config - Configuration object to validate
   * @returns {boolean} True if valid, false otherwise
   */
  static validate(config) {
      if (!config) {
          LoggerService.error('No configuration loaded');
          return false;
      }

      const requiredFields = [
          'location', 'company', 'person', 'client', 'amount', 'payment'
      ];

      for (const field of requiredFields) {
          if (!config[field]) {
              LoggerService.error(`Missing required field: ${field}`);
              return false;
          }
      }

      // Validate nested fields
      if (!this.validateCompany(config.company)) {
          return false;
      }

      if (!this.validatePerson(config.person)) {
          return false;
      }

      if (!this.validateClient(config.client)) {
          return false;
      }

      if (!this.validateAmount(config.amount)) {
          return false;
      }

      if (!this.validatePayment(config.payment)) {
          return false;
      }

      return true;
  }

  /**
   * Validate company information
   * @param {Object} company - Company object
   * @returns {boolean} True if valid
   */
  static validateCompany(company) {
      const requiredFields = ['name', 'registrationCountry', 'registrationNumber', 'address'];
      
      for (const field of requiredFields) {
          if (!company[field]) {
              LoggerService.error(`Missing required company field: ${field}`);
              return false;
          }
      }
      return true;
  }

  /**
   * Validate person information
   * @param {Object} person - Person object
   * @returns {boolean} True if valid
   */
  static validatePerson(person) {
      const requiredFields = ['name', 'identification'];
      
      for (const field of requiredFields) {
          if (!person[field]) {
              LoggerService.error(`Missing required person field: ${field}`);
              return false;
          }
      }
      return true;
  }

  /**
   * Validate client information
   * @param {Object} client - Client object
   * @returns {boolean} True if valid
   */
  static validateClient(client) {
      const requiredFields = ['name'];
      
      for (const field of requiredFields) {
          if (!client[field]) {
              LoggerService.error(`Missing required client field: ${field}`);
              return false;
          }
      }
      return true;
  }

  /**
   * Validate amount information
   * @param {Object} amount - Amount object
   * @returns {boolean} True if valid
   */
  static validateAmount(amount) {
      const requiredFields = ['hourlyRate'];
      
      for (const field of requiredFields) {
          if (!amount[field]) {
              LoggerService.error(`Missing required amount field: ${field}`);
              return false;
          }
      }

      if (typeof amount.hourlyRate !== 'number' || amount.hourlyRate <= 0) {
          LoggerService.error('Hourly rate must be a positive number');
          return false;
      }

      return true;
  }

  /**
   * Validate payment information
   * @param {Object} payment - Payment object
   * @returns {boolean} True if valid
   */
  static validatePayment(payment) {
      const requiredFields = ['accountHolder', 'accountNumber', 'accountType', 'routingNumber', 'bankName', 'bankAddress'];
      
      for (const field of requiredFields) {
          if (!payment[field]) {
              LoggerService.error(`Missing required payment field: ${field}`);
              return false;
          }
      }
      return true;
  }
}

module.exports = ConfigValidatorUtil; 