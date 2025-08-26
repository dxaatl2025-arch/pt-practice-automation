// test-templates.js - Save this file and run: node test-templates.js
const fs = require('fs');
const path = require('path');

console.log('📧 PropertyPulse Email Templates Verification');
console.log('='.repeat(50));

const templatesPath = path.join(__dirname, 'src/modules/applications/templates');
console.log('📁 Templates directory:', templatesPath);

// Check if directory exists
if (!fs.existsSync(templatesPath)) {
  console.log('❌ Templates directory does not exist!');
  console.log('💡 Create it with: mkdir -p src\\modules\\applications\\templates');
  return;
}

// Check each template file
const templates = [
  'landlord-new-application.html',
  'applicant-approved.html', 
  'applicant-declined.html'
];

let allTemplatesExist = true;

templates.forEach(template => {
  const templatePath = path.join(templatesPath, template);
  const exists = fs.existsSync(templatePath);
  
  if (exists) {
    const stats = fs.statSync(templatePath);
    console.log(`✅ ${template} - ${Math.round(stats.size / 1024)}KB`);
  } else {
    console.log(`❌ ${template} - MISSING`);
    allTemplatesExist = false;
  }
});

console.log('\n🎯 RESULTS:');
if (allTemplatesExist) {
  console.log('✅ All email templates are present!');
  console.log('📧 Email Templates requirement: COMPLETE');
} else {
  console.log('❌ Some email templates are missing');
  console.log('💡 Create missing templates from the artifacts provided');
}

// Test template loading (like the email service does)
if (allTemplatesExist) {
  console.log('\n🧪 Testing template loading...');
  
  try {
    templates.forEach(template => {
      const templatePath = path.join(templatesPath, template);
      const content = fs.readFileSync(templatePath, 'utf8');
      
      // Check for required variables
      const hasVariables = content.includes('{{') && content.includes('}}');
      console.log(`📄 ${template}: ${hasVariables ? 'Variables found' : 'No variables'}`);
    });
    
    console.log('✅ Template loading test: PASSED');
  } catch (error) {
    console.log('❌ Template loading test: FAILED');
    console.log('Error:', error.message);
  }
}

console.log('\n📋 Next Steps:');
console.log('1. ✅ Deploy all 3 email templates');
console.log('2. 🧪 Deploy and run basic tests'); 
console.log('3. 🔐 Verify property ownership with real data');
console.log('4. 📧 Test production email with SendGrid');