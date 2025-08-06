// Firebase mock for development
const mockAdmin = {
  apps: [],
  auth: () => ({
    verifyIdToken: async (token) => ({
      uid: 'dev-user', email: 'dev@test.com'
    })
  })
};

console.log('Using Firebase mock for development');
module.exports = mockAdmin;
