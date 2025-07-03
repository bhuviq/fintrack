import type { Category } from './types';

// Using Omit because id and userId are not relevant for hardcoded defaults.
// The getCategories service will merge these and handle IDs.
type DefaultCategory = Omit<Category, 'id' | 'userId'>;

export const DEFAULT_EXPENSE_CATEGORIES: DefaultCategory[] = [
  { name: 'Groceries', type: 'expense' },
  { name: 'Utilities', type: 'expense' },
  { name: 'Rent/Mortgage', type: 'expense' },
  { name: 'Transportation', type: 'expense' },
  { name: 'Entertainment', type: 'expense' },
  { name: 'Healthcare', type: 'expense' },
  { name: 'Dining Out', type: 'expense' },
  { name: 'Shopping', type: 'expense' },
];

export const DEFAULT_INCOME_CATEGORIES: DefaultCategory[] = [
  { name: 'Salary', type: 'income' },
  { name: 'Freelance', type: 'income' },
  { name: 'Bonus', type: 'income' },
  { name: 'Interest', type: 'income' },
];

export const DEFAULT_INVESTMENT_CATEGORIES: DefaultCategory[] = [
  { name: 'Stocks', type: 'investment' },
  { name: 'Bonds', type: 'investment' },
  { name: 'Real Estate', type: 'investment' },
  { name: 'Mutual Funds', type: 'investment' },
  { name: 'Gold', type: 'investment' },
  { name: 'Cryptocurrency', type: 'investment' },
];

export const ALL_DEFAULT_CATEGORIES: DefaultCategory[] = [
    ...DEFAULT_EXPENSE_CATEGORIES,
    ...DEFAULT_INCOME_CATEGORIES,
    ...DEFAULT_INVESTMENT_CATEGORIES,
];
