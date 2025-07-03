export interface Account {
  id: string; // Firestore document ID
  userId: string;
  name: string;
  type: 'bank' | 'credit-card';
  balance: number;
  limit?: number;
  dueDate?: number;
}

export type NewAccount = Omit<Account, 'id' | 'userId'>;

export interface Transaction {
  id: string; // Firestore document ID
  userId: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: string; // ISO string e.g., "2024-07-29"
  category: string;
  accountId: string;
}

export type NewTransaction = Omit<Transaction, 'id' | 'userId'>;


export interface Category {
  id: string; // Firestore document ID for custom, generated for default
  userId?: string; // Only for custom categories stored in Firestore
  name: string;
  type: 'expense' | 'income' | 'investment';
  isDefault?: boolean;
}

export type NewCategory = Omit<Category, 'id' | 'userId' | 'isDefault'>;

export interface Budget {
    id: string; // Firestore document ID
    userId: string;
    category: string;
    total: number;
}
export type NewBudget = Omit<Budget, 'id' | 'userId'>;


export interface GoalContribution {
    id: string;
    date: string;
    amount: number;
}

export interface Goal {
    id: string;
    userId: string;
    name: string;
    target: number;
    current: number;
    history: GoalContribution[];
}
export type NewGoal = Omit<Goal, 'id' | 'userId' | 'current' | 'history'>;


export interface InvestmentTransaction {
    id: string;
    date: string; // ISO string
    type: 'buy' | 'sell';
    quantity: number;
    price: number;
    unit?: 'oz' | 'gm';
}

export interface Investment {
    id: string;
    userId: string;
    name: string;
    symbol?: string;
    value: number;
    change: number;
    changeAmount: number;
    category: string;
    history: InvestmentTransaction[];
}
export type NewInvestment = Omit<Investment, 'id'|'userId'| 'change' | 'changeAmount' | 'history'>;


export interface UserProfile {
    id: string; // Corresponds to auth user ID
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    avatarUrl?: string;
    twoFactorEnabled?: boolean;
    twoFactorSecret?: string;
}
