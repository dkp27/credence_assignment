export interface CreateTransactionInput {
  accountId: number;
  amount: number;
  transactionType: 'DEBIT' | 'CREDIT';
}

export interface CreateTransactionResult {
  transactionId: number;
  status: 'SUCCESS' | 'FAILED';
  updatedBalance: number;
}

export interface AsyncTransactionJobResult {
  jobId: string;
  status: 'QUEUED';
  message: string;
  enqueuedAt: string;
}

export interface TransactionListQuery {
  page?: number;
  limit?: number;
  accountId?: number;
  transactionType?: 'DEBIT' | 'CREDIT';
  status?: 'PENDING' | 'SUCCESS' | 'FAILED';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  fromDate?: string;
  toDate?: string;
}

export interface TransactionListItem {
  transactionId: number;
  accountId: number;
  amount: number;
  transactionType: string;
  status: string;
  createdAt: Date;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
  };
}

export interface AccountSummaryResult {
  accountId: number;
  currentBalance: number;
  totalCredit: number;
  totalDebit: number;
  transactionCount: number;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: { field: string; message: string }[];
}
