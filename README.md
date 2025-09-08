# Sovereign Finance Cockpit

Sovereign Finance Cockpit is a web-based application designed to empower individuals to take control of their financial sovereignty. It provides a suite of tools to analyze financial documents, generate legal remedies, and manage interactions with creditors and debt collectors. The project is built on the philosophy that every individual has the right to understand and manage their financial affairs, and to seek remedy for any injustices they may face.

## Features

- **User Profile:** Store your personal information for easy use in all generated documents.
- **Creditor Address Book:** Manage a list of your creditors and their contact information.
- **Vehicle Financing Analysis:**
  - **TILA Disclosure Validation:** Analyze vehicle financing contracts for compliance with the Truth in Lending Act (TILA).
  - **Remedy Generation:** Generate remedy letters for TILA violations.
  - **Contract Scanning:** Scan contracts for specific terms such as hidden fees, misrepresentation, and arbitration clauses.
- **Credit Report Analysis (FCRA):**
  - **Dispute Letter Generation:** Generate dispute letters for inaccuracies found on your credit report, in accordance with the Fair Credit Reporting Act (FCRA).
- **FDCPA Debt Collector Log:**
  - **Violation Logging:** Log instances of abusive or unfair debt collection practices as defined by the Fair Debt Collection Practices Act (FDCPA).
  - **Cease and Desist Letters:** Prepare and generate Cease and Desist letters to debt collectors.
- **Monthly Bill Endorsement:**
  - **Bill Endorsement:** Upload and digitally endorse bills and other financial instruments.
  - **Negotiability Validation:** Validate the negotiability of financial instruments.
  - **Tender Letters and Notices:** Generate tender letters and notices for non-negotiable instruments.
- **Legal Resources:** Access a curated list of commentary and case law relevant to financial sovereignty.
- **Sovereign Loop:** Track your progress through the key stages of financial remedy: Intake, Validate, Remedy, Log, and Reflect.

## Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/kdmartin-boop/sovereign-financial-cockpit.git
   cd sovereign-financial-cockpit
   ```

2. **Install backend dependencies:**
   This project uses Python and Flask for the backend. You will need to have Python 3 installed. Install the required Python packages using pip:
   ```bash
   pip install -r requirements.txt
   ```

3. **Install frontend dependencies and build:**
   The frontend is built with React and Vite. You will need Node.js and npm (or yarn) installed.
   ```bash
   npm install
   npm run build
   ```

3. **Create the `uploads` directory:**
   The application requires an `uploads` directory to store the files that you upload. Create this directory in the root of the project:
   ```bash
   mkdir uploads
   ```

## Running the Project

To run the project, execute the `app.py` file from the root of the project directory:

```bash
python app.py
```

The application will be available at `http://127.0.0.1:5000` in your web browser.
