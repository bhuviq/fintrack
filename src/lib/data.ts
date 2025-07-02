export const MOCK_DATA = {
  summary: {
    netWorth: 125345.67,
    bankAccounts: 55234.12,
    investments: 72111.55,
    creditCardDebt: -2000,
  },
  recentTransactions: [
    {
      id: 1,
      description: 'Spotify Subscription',
      category: 'Entertainment',
      amount: 10.99,
      type: 'expense',
      date: '2024-07-28',
    },
    {
      id: 2,
      description: 'Paycheck',
      category: 'Income',
      amount: 2500,
      type: 'income',
      date: '2024-07-27',
    },
    {
      id: 3,
      description: 'Trader Joe\'s',
      category: 'Groceries',
      amount: 85.4,
      type: 'expense',
      date: '2024-07-26',
    },
    {
      id: 4,
      description: 'Exxon Mobil Gas',
      category: 'Transport',
      amount: 45.5,
      type: 'expense',
      date: '2024-07-25',
    },
    {
      id: 5,
      description: 'Apple Store',
      category: 'Shopping',
      amount: 999,
      type: 'expense',
      date: '2024-07-24',
    },
  ],
  allTransactions: [
    {
        id: 1,
        date: "2024-07-28",
        description: "Netflix",
        category: "Entertainment",
        amount: 15.99,
        type: "expense"
    },
    {
        id: 2,
        date: "2024-07-27",
        description: "Salary",
        category: "Income",
        amount: 4000,
        type: "income"
    },
    {
        id: 3,
        date: "2024-07-26",
        description: "Whole Foods Market",
        category: "Groceries",
        amount: 120.50,
        type: "expense"
    },
    {
        id: 4,
        date: "2024-07-25",
        description: "Uber Ride",
        category: "Transport",
        amount: 25.75,
        type: "expense"
    },
    {
        id: 5,
        date: "2024-07-24",
        description: "Amazon Purchase",
        category: "Shopping",
        amount: 75.99,
        type: "expense"
    },
    {
        id: 6,
        date: "2024-07-23",
        description: "Freelance Project",
        category: "Income",
        amount: 500,
        type: "income"
    },
    {
        id: 7,
        date: "2024-07-22",
        description: "Starbucks",
        category: "Food & Drink",
        amount: 5.50,
        type: "expense"
    },
    {
        id: 8,
        date: "2024-07-21",
        description: "Electricity Bill",
        category: "Utilities",
        amount: 85.00,
        type: "expense"
    },
  ],
  spending: [
    { name: 'Groceries', value: 850 },
    { name: 'Transport', value: 300 },
    { name: 'Entertainment', value: 420 },
    { name: 'Shopping', value: 1200 },
    { name: 'Utilities', value: 250 },
    { name: 'Other', value: 150 },
  ],
  goals: [
    {
      id: 1,
      name: 'Vacation to Japan',
      current: 3500,
      target: 8000,
    },
    {
      id: 2,
      name: 'New Car Down Payment',
      current: 8000,
      target: 10000,
    },
    {
      id: 3,
      name: 'Emergency Fund',
      current: 15000,
      target: 20000,
    },
  ],
  investments: [
    { id: 1, name: 'Apple Inc.', symbol: 'AAPL', value: 25000.50, change: 1.2, changeAmount: 297.01 },
    { id: 2, name: 'Tesla, Inc.', symbol: 'TSLA', value: 15000.75, change: -0.5, changeAmount: -75.38 },
    { id: 3, name: 'Vanguard S&P 500 ETF', symbol: 'VOO', value: 32110.30, change: 0.8, changeAmount: 254.84 },
  ],
  budgets: [
    { id: 1, category: 'Groceries', spent: 450, total: 800 },
    { id: 2, category: 'Shopping', spent: 300, total: 500 },
    { id: 3, category: 'Entertainment', spent: 150, total: 200 },
    { id: 4, category: 'Transport', spent: 120, total: 150 },
    { id: 5, category: 'Utilities', spent: 200, total: 250 },
  ],
  categories: [
    "Groceries",
    "Transport",
    "Entertainment",
    "Shopping",
    "Utilities",
    "Food & Drink",
    "Health",
    "Housing",
    "Income",
    "Other"
  ],
};
