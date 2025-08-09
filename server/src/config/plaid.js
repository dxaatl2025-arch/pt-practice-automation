const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');

const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID || 'test_client_id',
      'PLAID-SECRET': process.env.PLAID_SECRET || 'test_secret_key',
    },
  },
});

const plaidClient = new PlaidApi(configuration);

module.exports = plaidClient;