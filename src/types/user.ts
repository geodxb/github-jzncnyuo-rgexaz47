export type UserRole = 'admin' | 'investor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profilePic?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Investor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  country: string;
  location?: string;
  joinDate: string;
  initialDeposit: number;
  currentBalance: number;
  role: 'investor';
  isActive: boolean;
  accountType?: 'Standard' | 'Pro';
  accountStatus?: string;
  accountFlags?: {
    policyViolation?: boolean;
    policyViolationMessage?: string;
    pendingKyc?: boolean;
    kycMessage?: string;
    withdrawalDisabled?: boolean;
    withdrawalMessage?: string;
    pendingProfileChanges?: boolean;
    profileChangeMessage?: string;
  };
  tradingData?: {
    positionsPerDay?: number;
    pairs?: string[];
    platform?: string;
    leverage?: number;
    currency?: string;
  };
  bankDetails?: {
    accountHolderName?: string;
    bankName?: string;
    accountNumber?: string;
    swiftCode?: string;
    bankAddress?: string;
    currency?: string;
  };
  bankAccounts?: Array<{
    id: string;
    bankName: string;
    accountHolderName: string;
    accountNumber: string;
    iban?: string;
    swiftCode?: string;
    currency: string;
    country: string;
    isVerified: boolean;
    isPrimary: boolean;
    verificationStatus: 'pending' | 'approved' | 'rejected';
    rejectionReason?: string;
    createdAt: Date;
  }>;
  verification?: {
    idType?: string;
    depositMethod?: string;
    selectedCrypto?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  investorId: string;
  type: 'Deposit' | 'Withdrawal' | 'Earnings' | 'Credit';
  amount: number;
  date: string;
  status: 'Pending' | 'Completed' | 'Rejected';
  description?: string;
  createdAt: Date;
}

export interface WithdrawalRequest {
  id: string;
  investorId: string;
  investorName: string;
  amount: number;
  date: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  processedBy?: string;
  processedAt?: Date | null;
  approvalDate?: Date | null;
  reason?: string;
  w8benStatus?: 'not_required' | 'required' | 'submitted' | 'approved' | 'rejected';
  w8benSubmittedAt?: Date | null;
  w8benApprovedAt?: Date | null;
  w8benDocumentUrl?: string;
  w8benRejectionReason?: string;
  createdAt: Date;
}

export interface Commission {
  id: string;
  investorId: string;
  investorName: string;
  withdrawalAmount: number;
  commissionRate: number;
  commissionAmount: number;
  date: string;
  status: 'Earned' | 'Pending';
  withdrawalId?: string;
  createdAt: Date;
}