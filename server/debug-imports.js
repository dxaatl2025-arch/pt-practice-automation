try {
  console.log('Testing auth middleware...');
  const authMiddleware = require('./src/middleware/auth');
  console.log('authMiddleware type:', typeof authMiddleware);
  console.log('authMiddleware:', authMiddleware);
  
  console.log('\nTesting profiles route...');
  const profilesRoute = require('./src/routes/profiles');
  console.log('profilesRoute type:', typeof profilesRoute);
  console.log('profilesRoute:', profilesRoute);
  
  console.log('\nTesting feedback route...');
  const feedbackRoute = require('./src/routes/feedback');
  console.log('feedbackRoute type:', typeof feedbackRoute);
  console.log('feedbackRoute:', feedbackRoute);
  
} catch (error) {
  console.error('Import error:', error.message);
}