# Account Receivable PDF Generator

A simple Node.js application that generates account receivable PDF documents from CSV time reports and JSON configuration files.

## Features

- 📄 Generate professional PDF documents
- ⚡ Automatic amount calculation from CSV time reports
- 📅 Automatic period detection from CSV file names
- 💰 Automatic number formatting and conversion to words
- 🕒 Automatic work hours calculation from daily CSV entries
- 📊 CSV parsing with automatic month/period detection
- 📧 Email PDF directly after generation
- ✅ Configuration validation
- 🎯 Simple command-line interface

## Quick Start

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Create and configure `config.json`:**

   Copy the template and fill in your details:

   ```bash
   cp config.template.json config.json
   ```

   Edit `config.json` with your information:

   ```json
   {
     "location": "Your City, Country",
     "company": {
       "name": "Your Company Name",
       "registrationCountry": "Your Country",
       "registrationNumber": "Your Registration Number",
       "address": "Your Company Address"
     },
     "person": {
       "name": "Your Full Name",
       "identification": "Your ID Number"
     },
     "client": {
       "name": "Client Company Name"
     },
     "amount": {
       "hourlyRate": 50.00
     },
     "payment": {
       "accountHolder": "Your Name",
       "accountNumber": "Your Account Number",
       "accountType": "Your Account Type",
       "routingNumber": "Your Routing Number",
       "bankName": "Your Bank Name",
       "bankAddress": "Your Bank Address"
     }
   }
   ```

3. **Place your CSV time report in the `input/` folder**

4. **Set up email configuration (optional):**

   Create a `.env` file in the project root:

   ```bash
   MAILER_EMAIL=your-email@gmail.com
   MAILER_SECRET_KEY=your-app-password
   SENT_TO=recipient@example.com
   ```

5. **Generate PDF:**

   ```bash
   npm start
   ```

## Usage

```bash
npm start
```

## CSV Format

Place your time report CSV file in the `input/` folder.

- Go to your time reports spreadsheet and download the month you want in `.csv` format

## Automatic Features

The application automatically:

- Extracts month and year from CSV content
- Calculates total hours from daily entries
- Calculates total amount: `hourlyRate × total hours`
- Formats currency with commas and decimals
- Converts numbers to written words
- Uses current date for the document
- Validates all configuration fields

## Email Configuration

To enable email functionality, create a `.env` file in the project root with your email settings:

### Create .env File

Create a `.env` file in the project root:

```bash
# .env file
MAILER_EMAIL=your-email@techandes.com
MAILER_SECRET_KEY=your-app-secret-key
SENT_TO=invoices_email@techandes.com
```

### Setting up Gmail App Password

1. Set up 2 Step Verification in your Google account
2. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Enter `Account Receivable Generator` as the name for the new app
4. Copy the generated password
5. Use this password as your `MAILER_SECRET_KEY` (not your regular Gmail password)

## Optional Features

### Claude Code PRO subscription reimbursement

You can optionally include a separate section in the generated PDF to request reimbursement for a Claude Code PRO subscription used for development work on the invoiced project.

To enable this, configure the `claude` block in your `config.json`:

```json
"claude": {
  "enabled": true,
  "name": "Claude Code PRO",
  "amount": 20.00,
  "currency": "USD"
}
```

When `claude.enabled` is set to `true`:

- The main invoice calculation remains based solely on your hourly rate and time report.
- An additional \"Tools & Subscriptions\" section is added to the PDF, in formal English, explaining that:
  - You maintain an active Claude Code PRO (or the value of `claude.name`) subscription used exclusively for the client’s projects.
  - The subscription is a developer productivity and code quality tool that supports the timely delivery and maintainability of the software delivered.
- A clear sentence states that the reimbursable amount for the Claude Code PRO subscription for the invoiced period is the configured `amount` and `currency` (for example **USD 20.00**).

If the `claude` block is omitted or `enabled` is set to `false`, this section is not added and the behavior is identical to the original version.

## Dependencies

- **pdfkit**: PDF generation
- **nodemailer**: Email functionality
- **dotenv**: Environment variable loading

## License

MIT
