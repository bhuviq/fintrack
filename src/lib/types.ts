

export type Currency = 'USD' | 'GBP' | 'INR';

export interface Account {
  id: string; // Firestore document ID
  userId: string;
  name: string;
  type: 'bank' | 'credit-card' | 'broker';
  openingBalance: number;
  balanceDate: string; // ISO string e.g., "2024-07-29"
  currency: Currency;
  limit?: number;
  dueDate?: number;
  status?: 'active' | 'inactive';
}

export type NewAccount = Omit<Account, 'id' | 'userId'>;

export interface Transaction {
  id: string; // Firestore document ID
  userId: string;
  description: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer' | 'investment';
  date: string; // ISO string e.g., "2024-07-29"
  category: string;
  accountId: string; // Source for expense, Destination for income, From for transfer
  toAccountId?: string; // Destination for transfer
  investmentId?: string; // Link to investment document
  investmentQuantity?: number;
  investmentTransactionId?: string; // The ID of the corresponding transaction within the investment's history array
  investmentCharges?: InvestmentCharge[];
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
    currency: Currency;
}
export type NewBudget = Omit<Budget, 'id' | 'userId'>;


export interface GoalContribution {
    id: string;
    date: string;
    amount: number;
}

export interface Goal {
    id:string;
    userId: string;
    name: string;
    target: number;
    currency: Currency;
    current: number;
    history: GoalContribution[];
}
export type NewGoal = Omit<Goal, 'id' | 'userId' | 'current' | 'history'>;


export interface InvestmentCharge {
    name: string;
    type: 'fixed' | 'percentage';
    value: number;
}

export interface InvestmentTransaction {
    id: string;
    date: string; // ISO string
    type: 'buy' | 'sell';
    quantity: number;
    price: number;
    unit?: 'oz' | 'gm';
    charges?: InvestmentCharge[];
    // The ID of the master transaction in the top-level 'transactions' collection
    masterTransactionId?: string;
    accountId?: string;
}

export interface Investment {
    id: string;
    userId: string;
    name: string;
    symbol?: string;
    type?: string;
    value: number;
    change: number;
    changeAmount: number;
    category: string;
    currency: Currency;
    history: InvestmentTransaction[];
    openingQuantity?: number;
    openingPrice?: number;
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
    currency?: Currency;
}

export interface Insurance {
  id: string;
  userId: string;
  policyName: string;
  insurer: string;
  type: 'Car' | 'Health' | 'Life' | 'Bike' | 'Home' | 'Other';
  policyNumber: string;
  coverage: number;
  premium: number;
  premiumFrequency: 'monthly' | 'quarterly' | 'annually';
  startDate: string; // ISO Date
  endDate: string;   // ISO Date
  currency: Currency;
}
export type NewInsurance = Omit<Insurance, 'id' | 'userId'>;
