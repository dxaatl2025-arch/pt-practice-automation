const puppeteer = require('puppeteer');

const generateApplicationPdf = async (applicationData) => {
  console.log('📄 Generating PDF for application:', applicationData.id);
  
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'] // Add for Windows compatibility
    });
    
    const page = await browser.newPage();
    
    // Handle both fullName and firstName/lastName formats
    const applicantName = applicationData.fullName || 
                         `${applicationData.firstName || ''} ${applicationData.lastName || ''}`.trim() ||
                         'N/A';
    
    // Format the data safely
    const formatData = (value) => value || 'N/A';
    const formatCurrency = (value) => value ? `$${Number(value).toLocaleString()}` : '$0';
    const formatDate = (date) => {
      try {
        return date ? new Date(date).toLocaleDateString() : 'N/A';
      } catch {
        return 'N/A';
      }
    };
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 40px; 
            line-height: 1.4;
            color: #333;
          }
          .header { 
            border-bottom: 3px solid #2563eb; 
            padding-bottom: 20px; 
            margin-bottom: 30px;
            text-align: center;
          }
          .header h1 {
            color: #2563eb;
            margin: 0;
            font-size: 28px;
          }
          .property-info {
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            margin: 10px 0;
          }
          .section { 
            margin: 25px 0; 
            page-break-inside: avoid;
          }
          .section h3 {
            color: #374151;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 8px;
            margin-bottom: 15px;
          }
          .field { 
            margin: 10px 0; 
            display: flex;
            align-items: baseline;
          }
          .label { 
            font-weight: bold; 
            display: inline-block; 
            width: 180px; 
            color: #4b5563;
            flex-shrink: 0;
          }
          .value {
            color: #1f2937;
          }
          .status {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 12px;
            font-weight: bold;
            color: white;
            background-color: #059669;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #6b7280;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Rental Application</h1>
          <div class="property-info">
            <strong>Property:</strong> ${formatData(applicationData.property?.title)}
            <br>
            <strong>Address:</strong> ${formatData(applicationData.property?.addressStreet)}, 
            ${formatData(applicationData.property?.addressCity)}, ${formatData(applicationData.property?.addressState)}
          </div>
        </div>
        
        <div class="section">
          <h3>👤 Applicant Information</h3>
          <div class="field">
            <span class="label">Full Name:</span>
            <span class="value">${formatData(applicantName)}</span>
          </div>
          <div class="field">
            <span class="label">Email:</span>
            <span class="value">${formatData(applicationData.email)}</span>
          </div>
          <div class="field">
            <span class="label">Phone:</span>
            <span class="value">${formatData(applicationData.phone)}</span>
          </div>
          <div class="field">
            <span class="label">Date of Birth:</span>
            <span class="value">${formatDate(applicationData.dob)}</span>
          </div>
        </div>
        
        <div class="section">
          <h3>📍 Current Address</h3>
          <div class="field">
            <span class="label">Current Address:</span>
            <span class="value">${formatData(applicationData.currentAddress)}</span>
          </div>
          <div class="field">
            <span class="label">Years at Address:</span>
            <span class="value">${formatData(applicationData.yearsAtAddress)} years</span>
          </div>
          <div class="field">
            <span class="label">Reason for Moving:</span>
            <span class="value">${formatData(applicationData.reasonForMoving)}</span>
          </div>
        </div>
        
        <div class="section">
          <h3>💼 Employment Information</h3>
          <div class="field">
            <span class="label">Employer:</span>
            <span class="value">${formatData(applicationData.employerName)}</span>
          </div>
          <div class="field">
            <span class="label">Job Title:</span>
            <span class="value">${formatData(applicationData.jobTitle)}</span>
          </div>
          <div class="field">
            <span class="label">Employer Address:</span>
            <span class="value">${formatData(applicationData.employerAddress)}</span>
          </div>
          <div class="field">
            <span class="label">Employment Length:</span>
            <span class="value">${formatData(applicationData.employmentLength)}</span>
          </div>
          <div class="field">
            <span class="label">Monthly Income:</span>
            <span class="value">${formatCurrency(applicationData.monthlyIncome)}</span>
          </div>
          <div class="field">
            <span class="label">Other Income:</span>
            <span class="value">${formatData(applicationData.otherIncome) || 'None'}</span>
          </div>
        </div>
        
        <div class="section">
          <h3>👥 Reference</h3>
          <div class="field">
            <span class="label">Reference Name:</span>
            <span class="value">${formatData(applicationData.refName)}</span>
          </div>
          <div class="field">
            <span class="label">Relationship:</span>
            <span class="value">${formatData(applicationData.refRelationship)}</span>
          </div>
          <div class="field">
            <span class="label">Contact Info:</span>
            <span class="value">${formatData(applicationData.refContact)}</span>
          </div>
        </div>
        
        <div class="section">
          <h3>🏠 Household Information</h3>
          <div class="field">
            <span class="label">Number of Occupants:</span>
            <span class="value">${formatData(applicationData.occupants)}</span>
          </div>
          <div class="field">
            <span class="label">Desired Move-in Date:</span>
            <span class="value">${formatDate(applicationData.desiredMoveIn)}</span>
          </div>
          <div class="field">
            <span class="label">Pets:</span>
            <span class="value">${applicationData.hasPets ? 'Yes' : 'No'}</span>
          </div>
          <div class="field">
            <span class="label">Vehicles:</span>
            <span class="value">${applicationData.hasVehicles ? 'Yes' : 'No'}</span>
          </div>
        </div>
        
        <div class="section">
          <h3>⚠️ Disclosures</h3>
          <div class="field">
            <span class="label">Ever been evicted:</span>
            <span class="value">${applicationData.wasEvicted ? 'Yes' : 'No'}</span>
          </div>
          <div class="field">
            <span class="label">Felony conviction:</span>
            <span class="value">${applicationData.felony ? 'Yes' : 'No'}</span>
          </div>
          <div class="field">
            <span class="label">Late rent payments:</span>
            <span class="value">${applicationData.wasLateRent ? 'Yes' : 'No'}</span>
          </div>
        </div>
        
        <div class="section">
          <h3>📋 Application Status</h3>
          <div class="field">
            <span class="label">Status:</span>
            <span class="value">
              <span class="status">${formatData(applicationData.status)}</span>
            </span>
          </div>
          <div class="field">
            <span class="label">Submitted:</span>
            <span class="value">${formatDate(applicationData.submittedAt)}</span>
          </div>
          <div class="field">
            <span class="label">Digital Signature:</span>
            <span class="value">${formatData(applicationData.signature)}</span>
          </div>
        </div>
        
        <div class="footer">
          <p>This application was generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          <p>Application ID: ${applicationData.id}</p>
        </div>
      </body>
      </html>
    `;
    
    await page.setContent(html, { waitUntil: 'load' });
    
    const pdfBuffer = await page.pdf({ 
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        bottom: '20px', 
        left: '20px',
        right: '20px'
      }
    });
    
    console.log('✅ PDF generated successfully, size:', pdfBuffer.length, 'bytes');
    return pdfBuffer;
    
  } catch (error) {
    console.error('❌ PDF generation failed:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

module.exports = { generateApplicationPdf };