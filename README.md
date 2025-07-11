## FireFinTrack: Your Financial Companion

FireFinTrack is a comprehensive personal finance management application built with Next.js and powered by Firebase. It provides a user-friendly interface to track your income, expenses, budgets, goals, and investments, helping you achieve financial clarity and control.

**Key Features:**

*   **Account Management:** Effortlessly manage multiple bank accounts, credit cards, and other financial accounts in one place.
*   **Transaction Tracking:** Log and categorize your transactions to understand your spending habits and identify areas for improvement.
*   **Budgeting:** Create and track budgets for different categories to stay within your spending limits and reach your financial goals.
*   **Goal Setting:** Set and monitor financial goals, such as saving for a down payment or retirement, and track your progress.
*   **Investment Monitoring:** Keep track of your investment portfolio, including stocks, bonds, and other assets, and monitor their performance.
*   **Data Visualization:** Visualize your financial data with charts and graphs to gain insights into your financial health.
*   **Currency Conversion:** Support for multiple currencies to manage your finances in different regions.
*   **Two-Factor Authentication:** Enhance the security of your account with two-factor authentication.
*   **AI-Powered Transaction Categorization:** Leverage AI to automatically categorize your transactions, saving you time and effort.

**Feature Descriptions:**

*   **Account Management:** FireFinTrack allows you to add, edit, and delete various types of accounts, providing a centralized view of your financial holdings.
*   **Transaction Tracking:** Easily record income and expenses, assign categories, and add notes to your transactions for detailed tracking.
*   **Budgeting:** Create monthly or custom budgets for different spending categories. Track your progress against your budgets and receive alerts when you're approaching or exceeding your limits.
*   **Goal Setting:** Define your financial goals, set target amounts and timelines, and track your contributions towards achieving them.
*   **Investment Monitoring:** Add your investments, track their current value, and monitor their performance over time with interactive charts.
*   **Data Visualization:** Visualize your income, expenses, budgets, and investments with intuitive charts and graphs to gain a clear understanding of your financial situation.
*   **Currency Conversion:** Manage your finances in different currencies with automatic conversion rates.
*   **Two-Factor Authentication:** Add an extra layer of security to your account by enabling two-factor authentication.
*   **AI-Powered Transaction Categorization:** Utilize the power of AI to automatically categorize your transactions based on their descriptions, simplifying the process of tracking your spending.

## Installation and Setup

To run FireFinTrack locally, follow these steps:

1.  **Clone the repository:**
    
```bash
git clone <repository_url>
    cd firefintrack
```

2.  **Install dependencies:**
    
```bash
npm install
```

3.  **Set up Firebase:**
    *   Create a new Firebase project in the Firebase console.
    *   Enable the following Firebase services: Authentication, Firestore, and Storage.
    *   In your Firebase project settings, go to "Project settings" > "General" > "Your apps" and add a new web app.
    *   Copy the Firebase configuration object.

4.  **Create a `.env.local` file:**
    Create a file named `.env.local` in the root directory of the project and add the following variables, replacing the placeholders with your Firebase configuration and other necessary information:

    
```
env
    NEXT_PUBLIC_FIREBASE_API_KEY=<your_firebase_api_key>
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<your_firebase_auth_domain>
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=<your_firebase_project_id>
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<your_firebase_storage_bucket>
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<your_firebase_messaging_sender_id>
    NEXT_PUBLIC_FIREBASE_APP_ID=<your_firebase_app_id>
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=<your_firebase_measurement_id>
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<your_firebase_storage_bucket>
    NEXT_PUBLIC_CURRENCY_API_KEY=<your_currency_api_key>
    NEXT_PUBLIC_GENKIT_API_KEY=<your_genkit_api_key>
```

    *   `NEXT_PUBLIC_FIREBASE_...`: These are your Firebase configuration variables.
    *   `NEXT_PUBLIC_CURRENCY_API_KEY`: Obtain an API key from a currency exchange rate provider (e.g., ExchangeRate-API).
    *   `NEXT_PUBLIC_GENKIT_API_KEY`: Obtain an API key for the AI service used for transaction categorization (e.g., Google AI Platform).

5.  **Run the development server:**
    
```bash
npm run dev
```

    The application will be available at `http://localhost:3000`.

## Project Structure

The project follows a standard Next.js structure. Key directories include:

*   `src/app`: Contains the application pages and routing.
*   `src/components`: Reusable UI components.
*   `src/lib`: Utility functions and constants.
*   `src/services`: Firebase service interactions.
*   `src/context`: React context for state management.
*   `src/hooks`: Custom React hooks.
*   `src/ai`: AI-related code, including Genkit flows.

## To Get Started

To get started with the code, take a look at `src/app/page.tsx`, which is the main entry point of the application.
