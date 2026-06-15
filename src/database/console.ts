const divider = () => console.log('═'.repeat(50));

export const printSetupHeader = (): void => {
  console.log('');
  divider();
  console.log('  Credence Database Setup');
  divider();
  console.log('');
};

export const printStep = (step: number, total: number, message: string): void => {
  console.log(`[${step}/${total}] ${message}`);
};

export const printSuccess = (message: string): void => {
  console.log(`      ✓ ${message}`);
};

export const printSkip = (message: string): void => {
  console.log(`      → ${message}`);
};

export const printError = (message: string): void => {
  console.log(`      ✗ ${message}`);
};

export const printSetupComplete = (
  dbCreated: boolean,
  seeded: boolean,
  stats?: { accounts: number; transactions: number }
): void => {
  console.log('');
  divider();
  console.log('  Setup completed successfully!');
  divider();
  console.log('');
  console.log('What was done:');
  console.log('  • MySQL connection verified');
  if (dbCreated) {
    console.log('  • Database "credence_db" created');
  } else {
    console.log('  • Database "credence_db" already existed (not created again)');
  }
  console.log('  • Tables migrated: users, accounts, transactions');
  if (seeded && stats) {
    console.log(`  • Sample data inserted: ${stats.accounts} accounts, ${stats.transactions} transactions`);
    console.log('  • Assignment demo account: ID 101 (use in Swagger examples)');
  } else if (seeded) {
    console.log('  • Sample data inserted (users, accounts, transactions)');
  } else {
    console.log('  • Sample data skipped (already exists in database)');
  }
  console.log('');
  console.log('Next steps:');
  console.log('  npm run dev                    → Start the API server');
  console.log('  http://localhost:3000/api-docs → Open Swagger UI');
  console.log('');
  console.log('Login (POST /api/v1/auth/login):');
  console.log('  Email:    admin@credence.com');
  console.log('  Password: admin123');
  console.log('');
  console.log('Try these in Swagger after login:');
  console.log('  POST /api/v1/transactions  →  { "accountId": 101, "amount": 5000, "transactionType": "DEBIT" }');
  console.log('  GET  /api/v1/accounts/101/summary');
  console.log('  GET  /api/v1/transactions?accountId=101&page=1&limit=20');
  console.log('');
  console.log('Re-seed database from scratch:');
  console.log('  SEED_FORCE=true npm run db:setup');
  console.log('');
};

export const printSetupFailed = (): void => {
  console.log('');
  divider();
  console.log('  Setup failed');
  divider();
  console.log('');
};
