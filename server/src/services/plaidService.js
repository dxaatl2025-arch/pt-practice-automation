// server/src/services/plaidService.js
const plaidClient = require('../config/plaid');
const PaymentIntegration = require('../models/PaymentIntegration');

class PlaidService {
  // Create link token
  async createLinkToken(userId, userRole) {
    try {
      // For development, return mock
      const linkToken = this.getMockLinkToken();

      await PaymentIntegration.findOneAndUpdate(
        { userId },
        {
          userId,
          userRole,
          'plaid.linkToken': linkToken.link_token,
          'plaid.linkTokenExpiry': new Date(Date.now() + 4 * 60 * 60 * 1000)
        },
        { upsert: true }
      );

      return linkToken;
    } catch (error) {
      console.error('Error creating link token:', error);
      throw new Error('Failed to initialize bank linking');
    }
  }

  // Exchange public token
  async exchangePublicToken(publicToken, userId) {
    try {
      // For development, return mock
      const result = this.getMockTokenExchange(userId);

      await PaymentIntegration.findOneAndUpdate(
        { userId },
        {
          'plaid.accessToken': 'access_token_mock_' + Date.now(),
          'plaid.itemId': 'item_mock_' + Date.now(),
          'plaid.linkedAccounts': result.accounts
        }
      );

      return result;
    } catch (error) {
      console.error('Error exchanging public token:', error);
      throw new Error('Failed to link bank account');
    }
  }

  // Mock functions for development
  getMockLinkToken() {
    return {
      link_token: 'link-sandbox-' + Date.now()
    };
  }

  getMockTokenExchange(userId) {
    return {
      success: true,
      accounts: [
        {
          accountId: 'mock_checking_' + Date.now(),
          accountName: 'Checking Account',
          accountType: 'depository',
          accountSubtype: 'checking',
          mask: '0000',
          isActive: true
        }
      ]
    };
  }
}

module.exports = new PlaidService();