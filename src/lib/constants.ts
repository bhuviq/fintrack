
import type { Category } from './types';

// Using Omit because id and userId are not relevant for hardcoded defaults.
// The getCategories service will merge these and handle IDs.
type DefaultCategory = Omit<Category, 'id' | 'userId'>;

export const DEFAULT_EXPENSE_CATEGORIES: DefaultCategory[] = [
  { name: 'Groceries', type: 'expense', isDefault: true },
  { name: 'Utilities', type: 'expense', isDefault: true },
  { name: 'Rent or Mortgage', type: 'expense', isDefault: true },
  { name: 'Transportation', type: 'expense', isDefault: true },
  { name: 'Entertainment', type: 'expense', isDefault: true },
  { name: 'Healthcare', type: 'expense', isDefault: true },
  { name: 'Dining Out', type: 'expense', isDefault: true },
  { name: 'Shopping', type: 'expense', isDefault: true },
  { name: 'Insurance', type: 'expense', isDefault: true },
];

export const DEFAULT_INCOME_CATEGORIES: DefaultCategory[] = [
  { name: 'Salary', type: 'income', isDefault: true },
  { name: 'Freelance', type: 'income', isDefault: true },
  { name: 'Bonus', type: 'income', isDefault: true },
  { name: 'Interest', type: 'income', isDefault: true },
];

export const DEFAULT_INVESTMENT_CATEGORIES: DefaultCategory[] = [
  { name: 'Stocks', type: 'investment', isDefault: true },
  { name: 'Bonds', type: 'investment', isDefault: true },
  { name: 'Real Estate', type: 'investment', isDefault: true },
  { name: 'Mutual Funds', type: 'investment', isDefault: true },
  { name: 'Gold', type: 'investment', isDefault: true },
  { name: 'Cryptocurrency', type: 'investment', isDefault: true },
];

export const ALL_DEFAULT_CATEGORIES: DefaultCategory[] = [
    ...DEFAULT_EXPENSE_CATEGORIES,
    ...DEFAULT_INCOME_CATEGORIES,
    ...DEFAULT_INVESTMENT_CATEGORIES,
];
