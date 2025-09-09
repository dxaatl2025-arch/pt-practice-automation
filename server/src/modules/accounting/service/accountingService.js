const { PrismaClient } = require('@prisma/client');

class AccountingService {
  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get chart of accounts
   * @param {string} userId - User ID for filtering
   * @returns {Promise<Array>} Chart of accounts
   */
  async getChartOfAccounts(userId) {
    try {
      const accounts = await this.prisma.account.findMany({
        where: { userId },
        orderBy: [
          { accountType: 'asc' },
          { accountCode: 'asc' }
        ]
      });

      return accounts;
    } catch (error) {
      console.error('Error getting chart of accounts:', error);
      throw new Error('Failed to retrieve chart of accounts');
    }
  }

  /**
   * Create new account
   * @param {string} userId - User ID
   * @param {Object} accountData - Account data
   * @returns {Promise<Object>} Created account
   */
  async createAccount(userId, accountData) {
    try {
      const { accountCode, accountName, accountType, description } = accountData;

      // Validate account type
      const validTypes = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];
      if (!validTypes.includes(accountType)) {
        throw new Error(`Invalid account type. Must be one of: ${validTypes.join(', ')}`);
      }

      // Check if account code already exists for this user
      const existingAccount = await this.prisma.account.findFirst({
        where: {
          userId,
          accountCode
        }
      });

      if (existingAccount) {
        throw new Error('Account code already exists');
      }

      const account = await this.prisma.account.create({
        data: {
          accountCode,
          accountName,
          accountType,
          description,
          balance: 0,
          userId,
          isActive: true
        }
      });

      return account;
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  }

  /**
   * Update account
   * @param {string} userId - User ID
   * @param {string} accountId - Account ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated account
   */
  async updateAccount(userId, accountId, updateData) {
    try {
      // Verify account exists and belongs to user
      const existingAccount = await this.prisma.account.findFirst({
        where: {
          id: accountId,
          userId
        }
      });

      if (!existingAccount) {
        throw new Error('Account not found or access denied');
      }

      const { accountName, description, isActive } = updateData;

      const account = await this.prisma.account.update({
        where: { id: accountId },
        data: {
          ...(accountName && { accountName }),
          ...(description !== undefined && { description }),
          ...(isActive !== undefined && { isActive })
        }
      });

      return account;
    } catch (error) {
      console.error('Error updating account:', error);
      throw error;
    }
  }

  /**
   * Delete account (soft delete - mark as inactive)
   * @param {string} userId - User ID
   * @param {string} accountId - Account ID
   * @returns {Promise<Object>} Deleted account
   */
  async deleteAccount(userId, accountId) {
    try {
      // Verify account exists and belongs to user
      const existingAccount = await this.prisma.account.findFirst({
        where: {
          id: accountId,
          userId
        }
      });

      if (!existingAccount) {
        throw new Error('Account not found or access denied');
      }

      // Check if account has been used in journal entries
      const journalEntryCount = await this.prisma.journalEntryLine.count({
        where: { accountId }
      });

      if (journalEntryCount > 0) {
        // Soft delete - mark as inactive
        const account = await this.prisma.account.update({
          where: { id: accountId },
          data: { isActive: false }
        });
        return account;
      } else {
        // Hard delete if no journal entries exist
        const account = await this.prisma.account.delete({
          where: { id: accountId }
        });
        return account;
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  }

  /**
   * Create journal entry
   * @param {string} userId - User ID
   * @param {Object} entryData - Journal entry data
   * @returns {Promise<Object>} Created journal entry
   */
  async createJournalEntry(userId, entryData) {
    try {
      const { description, reference, entryDate, lines } = entryData;

      // Validate that debits equal credits
      const totalDebits = lines.reduce((sum, line) => sum + (line.debitAmount || 0), 0);
      const totalCredits = lines.reduce((sum, line) => sum + (line.creditAmount || 0), 0);

      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        throw new Error('Journal entry must balance: total debits must equal total credits');
      }

      // Verify all accounts exist and belong to user
      const accountIds = lines.map(line => line.accountId);
      const accounts = await this.prisma.account.findMany({
        where: {
          id: { in: accountIds },
          userId,
          isActive: true
        }
      });

      if (accounts.length !== accountIds.length) {
        throw new Error('One or more accounts not found or inactive');
      }

      // Create journal entry with lines in a transaction
      const journalEntry = await this.prisma.$transaction(async (prisma) => {
        // Create the journal entry
        const entry = await prisma.journalEntry.create({
          data: {
            description,
            reference,
            entryDate: new Date(entryDate),
            userId
          }
        });

        // Create the journal entry lines
        const entryLines = await Promise.all(
          lines.map(line => 
            prisma.journalEntryLine.create({
              data: {
                journalEntryId: entry.id,
                accountId: line.accountId,
                description: line.description,
                debitAmount: line.debitAmount || 0,
                creditAmount: line.creditAmount || 0
              }
            })
          )
        );

        // Update account balances
        await Promise.all(
          lines.map(async (line) => {
            const account = accounts.find(a => a.id === line.accountId);
            let balanceChange = 0;

            // Calculate balance change based on account type and normal balance
            if (['ASSET', 'EXPENSE'].includes(account.accountType)) {
              // Normal debit balance accounts
              balanceChange = (line.debitAmount || 0) - (line.creditAmount || 0);
            } else {
              // Normal credit balance accounts (LIABILITY, EQUITY, REVENUE)
              balanceChange = (line.creditAmount || 0) - (line.debitAmount || 0);
            }

            await prisma.account.update({
              where: { id: line.accountId },
              data: {
                balance: {
                  increment: balanceChange
                }
              }
            });
          })
        );

        return {
          ...entry,
          lines: entryLines
        };
      });

      return journalEntry;
    } catch (error) {
      console.error('Error creating journal entry:', error);
      throw error;
    }
  }

  /**
   * Get journal entries
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Journal entries
   */
  async getJournalEntries(userId, filters = {}) {
    try {
      const {
        startDate,
        endDate,
        accountId,
        page = 1,
        limit = 50,
        sortBy = 'entryDate',
        sortOrder = 'desc'
      } = filters;

      const where = { userId };

      if (startDate) {
        where.entryDate = { ...where.entryDate, gte: new Date(startDate) };
      }
      if (endDate) {
        where.entryDate = { ...where.entryDate, lte: new Date(endDate) };
      }
      if (accountId) {
        where.lines = {
          some: { accountId }
        };
      }

      const skip = (page - 1) * limit;
      const orderBy = {};
      orderBy[sortBy] = sortOrder;

      const [entries, total] = await Promise.all([
        this.prisma.journalEntry.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            lines: {
              include: {
                account: {
                  select: {
                    id: true,
                    accountCode: true,
                    accountName: true,
                    accountType: true
                  }
                }
              }
            }
          }
        }),
        this.prisma.journalEntry.count({ where })
      ]);

      return {
        entries,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting journal entries:', error);
      throw new Error('Failed to retrieve journal entries');
    }
  }

  /**
   * Generate trial balance
   * @param {string} userId - User ID
   * @param {Date} asOfDate - As of date
   * @returns {Promise<Object>} Trial balance
   */
  async getTrialBalance(userId, asOfDate) {
    try {
      const accounts = await this.prisma.account.findMany({
        where: {
          userId,
          isActive: true
        },
        orderBy: [
          { accountType: 'asc' },
          { accountCode: 'asc' }
        ]
      });

      // Calculate balances as of the specified date
      const trialBalanceData = await Promise.all(
        accounts.map(async (account) => {
          // Get all journal entry lines for this account up to the specified date
          const lines = await this.prisma.journalEntryLine.findMany({
            where: {
              accountId: account.id,
              journalEntry: {
                entryDate: { lte: new Date(asOfDate) }
              }
            }
          });

          let balance = 0;
          lines.forEach(line => {
            if (['ASSET', 'EXPENSE'].includes(account.accountType)) {
              // Normal debit balance accounts
              balance += (line.debitAmount || 0) - (line.creditAmount || 0);
            } else {
              // Normal credit balance accounts
              balance += (line.creditAmount || 0) - (line.debitAmount || 0);
            }
          });

          const totalDebits = lines.reduce((sum, line) => sum + (line.debitAmount || 0), 0);
          const totalCredits = lines.reduce((sum, line) => sum + (line.creditAmount || 0), 0);

          return {
            ...account,
            balance: Math.round(balance * 100) / 100,
            totalDebits: Math.round(totalDebits * 100) / 100,
            totalCredits: Math.round(totalCredits * 100) / 100,
            debitBalance: balance > 0 ? Math.abs(balance) : 0,
            creditBalance: balance < 0 ? Math.abs(balance) : 0
          };
        })
      );

      // Calculate totals
      const totalDebits = trialBalanceData.reduce((sum, account) => sum + account.debitBalance, 0);
      const totalCredits = trialBalanceData.reduce((sum, account) => sum + account.creditBalance, 0);

      return {
        asOfDate: new Date(asOfDate),
        accounts: trialBalanceData.filter(account => 
          Math.abs(account.balance) > 0.01 || account.totalDebits > 0 || account.totalCredits > 0
        ),
        totals: {
          totalDebits: Math.round(totalDebits * 100) / 100,
          totalCredits: Math.round(totalCredits * 100) / 100,
          difference: Math.round((totalDebits - totalCredits) * 100) / 100,
          isBalanced: Math.abs(totalDebits - totalCredits) < 0.01
        }
      };
    } catch (error) {
      console.error('Error generating trial balance:', error);
      throw new Error('Failed to generate trial balance');
    }
  }

  /**
   * Generate income statement
   * @param {string} userId - User ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Income statement
   */
  async getIncomeStatement(userId, startDate, endDate) {
    try {
      const accounts = await this.prisma.account.findMany({
        where: {
          userId,
          isActive: true,
          accountType: { in: ['REVENUE', 'EXPENSE'] }
        },
        include: {
          journalEntryLines: {
            where: {
              journalEntry: {
                entryDate: {
                  gte: new Date(startDate),
                  lte: new Date(endDate)
                }
              }
            }
          }
        },
        orderBy: [
          { accountType: 'asc' },
          { accountCode: 'asc' }
        ]
      });

      const revenueAccounts = [];
      const expenseAccounts = [];
      let totalRevenue = 0;
      let totalExpenses = 0;

      accounts.forEach(account => {
        let accountTotal = 0;
        
        account.journalEntryLines.forEach(line => {
          if (account.accountType === 'REVENUE') {
            accountTotal += (line.creditAmount || 0) - (line.debitAmount || 0);
          } else { // EXPENSE
            accountTotal += (line.debitAmount || 0) - (line.creditAmount || 0);
          }
        });

        const accountData = {
          id: account.id,
          accountCode: account.accountCode,
          accountName: account.accountName,
          amount: Math.round(accountTotal * 100) / 100
        };

        if (account.accountType === 'REVENUE') {
          revenueAccounts.push(accountData);
          totalRevenue += accountTotal;
        } else {
          expenseAccounts.push(accountData);
          totalExpenses += accountTotal;
        }
      });

      const netIncome = totalRevenue - totalExpenses;

      return {
        period: {
          startDate: new Date(startDate),
          endDate: new Date(endDate)
        },
        revenue: {
          accounts: revenueAccounts.filter(a => Math.abs(a.amount) > 0.01),
          total: Math.round(totalRevenue * 100) / 100
        },
        expenses: {
          accounts: expenseAccounts.filter(a => Math.abs(a.amount) > 0.01),
          total: Math.round(totalExpenses * 100) / 100
        },
        netIncome: Math.round(netIncome * 100) / 100
      };
    } catch (error) {
      console.error('Error generating income statement:', error);
      throw new Error('Failed to generate income statement');
    }
  }

  /**
   * Generate balance sheet
   * @param {string} userId - User ID
   * @param {Date} asOfDate - As of date
   * @returns {Promise<Object>} Balance sheet
   */
  async getBalanceSheet(userId, asOfDate) {
    try {
      const accounts = await this.prisma.account.findMany({
        where: {
          userId,
          isActive: true,
          accountType: { in: ['ASSET', 'LIABILITY', 'EQUITY'] }
        },
        include: {
          journalEntryLines: {
            where: {
              journalEntry: {
                entryDate: { lte: new Date(asOfDate) }
              }
            }
          }
        },
        orderBy: [
          { accountType: 'asc' },
          { accountCode: 'asc' }
        ]
      });

      const assets = [];
      const liabilities = [];
      const equity = [];
      let totalAssets = 0;
      let totalLiabilities = 0;
      let totalEquity = 0;

      accounts.forEach(account => {
        let accountBalance = 0;
        
        account.journalEntryLines.forEach(line => {
          if (account.accountType === 'ASSET') {
            accountBalance += (line.debitAmount || 0) - (line.creditAmount || 0);
          } else { // LIABILITY or EQUITY
            accountBalance += (line.creditAmount || 0) - (line.debitAmount || 0);
          }
        });

        if (Math.abs(accountBalance) > 0.01) {
          const accountData = {
            id: account.id,
            accountCode: account.accountCode,
            accountName: account.accountName,
            amount: Math.round(accountBalance * 100) / 100
          };

          if (account.accountType === 'ASSET') {
            assets.push(accountData);
            totalAssets += accountBalance;
          } else if (account.accountType === 'LIABILITY') {
            liabilities.push(accountData);
            totalLiabilities += accountBalance;
          } else { // EQUITY
            equity.push(accountData);
            totalEquity += accountBalance;
          }
        }
      });

      return {
        asOfDate: new Date(asOfDate),
        assets: {
          accounts: assets,
          total: Math.round(totalAssets * 100) / 100
        },
        liabilities: {
          accounts: liabilities,
          total: Math.round(totalLiabilities * 100) / 100
        },
        equity: {
          accounts: equity,
          total: Math.round(totalEquity * 100) / 100
        },
        totalLiabilitiesAndEquity: Math.round((totalLiabilities + totalEquity) * 100) / 100,
        isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
      };
    } catch (error) {
      console.error('Error generating balance sheet:', error);
      throw new Error('Failed to generate balance sheet');
    }
  }
}

module.exports = AccountingService;