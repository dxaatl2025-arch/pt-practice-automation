// server/src/services/pdfService.js
const PDFDocument = require('pdfkit');

class PDFService {
  constructor() {
    this.pageMargin = 50;
    this.lineHeight = 20;
  }

  async generateApplicationPDF(application) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          margin: this.pageMargin,
          size: 'A4',
          info: {
            Title: `Rental Application - ${application.application_number}`,
            Author: 'PropertyPulse',
            Subject: 'Rental Application',
            Creator: 'PropertyPulse System'
          }
        });

        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        this.buildPDFContent(doc, application);
        doc.end();

      } catch (error) {
        reject(error);
      }
    });
  }

  buildPDFContent(doc, application) {
    // Header
    this.addHeader(doc, application);
    
    // Application Summary
    this.addSection(doc, 'Application Summary', this.buildSummaryContent(application));
    
    // Personal Information
    this.addSection(doc, 'Personal Information', this.buildPersonalInfoContent(application));
    
    // Address Information
    this.addSection(doc, 'Address Information', this.buildAddressInfoContent(application));
    
    // Employment Information
    this.addSection(doc, 'Employment Information', this.buildEmploymentInfoContent(application));
    
    // References
    this.addSection(doc, 'References', this.buildReferencesContent(application));
    
    // Household Information
    this.addSection(doc, 'Household Information', this.buildHouseholdInfoContent(application));
    
    // Background Information
    this.addSection(doc, 'Background Information', this.buildBackgroundInfoContent(application));
    
    // Signature and Legal
    this.addSignatureSection(doc, application);
    
    // Footer
    this.addFooter(doc);
  }

  addHeader(doc, application) {
    // Logo area
    doc.fontSize(24)
       .fillColor('#2563eb')
       .text('PropertyPulse', this.pageMargin, this.pageMargin)
       .fontSize(16)
       .fillColor('#666')
       .text('Rental Application', this.pageMargin, this.pageMargin + 30);

    // Application number and date
    doc.fontSize(12)
       .fillColor('#333')
       .text(`Application Number: ${application.application_number}`, 400, this.pageMargin)
       .text(`Date Submitted: ${new Date(application.created_at || new Date()).toLocaleDateString()}`, 400, this.pageMargin + 15)
       .text(`Status: ${(application.application_status || 'pending').charAt(0).toUpperCase() + (application.application_status || 'pending').slice(1)}`, 400, this.pageMargin + 30);

    // Add line separator
    doc.moveTo(this.pageMargin, this.pageMargin + 70)
       .lineTo(545, this.pageMargin + 70)
       .strokeColor('#ddd')
       .stroke();

    doc.y = this.pageMargin + 90;
  }

  addSection(doc, title, content) {
    // Check if we need a new page
    if (doc.y > 700) {
      doc.addPage();
    }

    // Section title
    doc.fontSize(14)
       .fillColor('#2563eb')
       .text(title, this.pageMargin, doc.y + 10);

    doc.y += 25;

    // Section content
    doc.fontSize(10)
       .fillColor('#333');

    content.forEach(item => {
      if (doc.y > 720) {
        doc.addPage();
        doc.y = this.pageMargin;
      }

      if (item.type === 'field') {
        doc.font('Helvetica-Bold')
           .text(`${item.label}:`, this.pageMargin, doc.y, { continued: true, width: 150 })
           .font('Helvetica')
           .text(` ${item.value}`, { width: 350 });
        doc.y += this.lineHeight;
      } else if (item.type === 'textarea') {
        doc.font('Helvetica-Bold')
           .text(`${item.label}:`, this.pageMargin, doc.y)
           .font('Helvetica')
           .text(item.value, this.pageMargin + 10, doc.y + 15, { width: 480 });
        doc.y += Math.max(30, Math.ceil(item.value.length / 80) * 15);
      }
    });

    doc.y += 10;
  }

  addSignatureSection(doc, application) {
    if (doc.y > 600) {
      doc.addPage();
    }

    // Signature section title
    doc.fontSize(14)
       .fillColor('#2563eb')
       .text('Digital Signature & Consent', this.pageMargin, doc.y + 10);

    doc.y += 30;

    // Background check consent
    doc.fontSize(10)
       .fillColor('#333')
       .font('Helvetica-Bold')
       .text('Background Check Consent:', this.pageMargin, doc.y)
       .font('Helvetica')
       .text(application.background_check_consent ? 'GRANTED' : 'NOT GRANTED', 200, doc.y);

    doc.y += 25;

    // Consent text
    const consentText = `I authorize the landlord to conduct a background check, credit check, and verify employment and rental history as part of the application process.`;
    
    doc.font('Helvetica')
       .fontSize(9)
       .text(consentText, this.pageMargin, doc.y, { width: 480, align: 'justify' });

    doc.y += 40;

    // Signature area
    if (application.signature_data) {
      doc.font('Helvetica-Bold')
         .fontSize(10)
         .text('Digital Signature:', this.pageMargin, doc.y);
      
      doc.font('Helvetica')
         .text('[Digital signature captured]', this.pageMargin + 10, doc.y + 15)
         .text(`Signed on: ${new Date(application.date_signed || application.created_at).toLocaleString()}`, this.pageMargin + 10, doc.y + 30);
    }

    doc.y += 60;

    // Legal disclaimer
    const disclaimer = `APPLICANT CERTIFICATION: I certify that all information provided in this application is true and complete. I understand that false information may result in rejection of this application or termination of tenancy if discovered later.`;
    
    doc.fontSize(8)
       .fillColor('#666')
       .text(disclaimer, this.pageMargin, doc.y, { 
         width: 480, 
         align: 'justify' 
       });
  }

  addFooter(doc) {
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      
      // Footer line
      doc.moveTo(this.pageMargin, 770)
         .lineTo(545, 770)
         .strokeColor('#ddd')
         .stroke();

      // Footer text
      doc.fontSize(8)
         .fillColor('#666')
         .text('PropertyPulse Rental Application', this.pageMargin, 780)
         .text(`Page ${i + 1} of ${pages.count}`, 0, 780, { align: 'right', width: 545 })
         .text(`Generated on ${new Date().toLocaleString()}`, this.pageMargin, 790, { width: 200 });
    }
  }

  buildSummaryContent(application) {
    const formattedIncome = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(application.monthly_gross_income);

    return [
      { type: 'field', label: 'Applicant Name', value: application.full_name || 'Not provided' },
      { type: 'field', label: 'Email', value: application.email || 'Not provided' },
      { type: 'field', label: 'Phone', value: application.phone || 'Not provided' },
      { type: 'field', label: 'Monthly Income', value: formattedIncome },
      { type: 'field', label: 'Desired Move-in Date', value: new Date(application.desired_move_in_date).toLocaleDateString() },
      { type: 'field', label: 'Number of Occupants', value: application.number_of_occupants || '1' },
      { type: 'field', label: 'Pets', value: application.has_pets ? 'Yes' : 'No' },
      { type: 'field', label: 'Vehicles', value: application.has_vehicles ? 'Yes' : 'No' }
    ];
  }

  buildPersonalInfoContent(application) {
    return [
      { type: 'field', label: 'Full Name', value: application.full_name || 'Not provided' },
      { type: 'field', label: 'Date of Birth', value: new Date(application.date_of_birth).toLocaleDateString() },
      { type: 'field', label: 'Email Address', value: application.email || 'Not provided' },
      { type: 'field', label: 'Phone Number', value: application.phone || 'Not provided' }
    ];
  }

  buildAddressInfoContent(application) {
    const content = [
      { type: 'textarea', label: 'Current Address', value: application.current_address || 'Not provided' },
      { type: 'field', label: 'Duration at Current Address', value: application.current_address_duration || 'Not provided' },
      { type: 'textarea', label: 'Reason for Moving', value: application.reason_for_moving || 'Not provided' }
    ];

    if (application.previous_address) {
      content.push(
        { type: 'textarea', label: 'Previous Address', value: application.previous_address },
        { type: 'field', label: 'Previous Landlord', value: application.previous_landlord_name || 'Not provided' },
        { type: 'field', label: 'Previous Landlord Contact', value: application.previous_landlord_contact || 'Not provided' },
        { type: 'field', label: 'Late Rent History', value: application.late_rent_history ? 'Yes' : 'No' }
      );
    }

    return content;
  }

  buildEmploymentInfoContent(application) {
    const formattedIncome = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(application.monthly_gross_income);

    const content = [
      { type: 'field', label: 'Employer Name', value: application.employer_name || 'Not provided' },
      { type: 'field', label: 'Job Title', value: application.job_title || 'Not provided' },
      { type: 'textarea', label: 'Employer Address', value: application.employer_address || 'Not provided' },
      { type: 'field', label: 'Employer Phone', value: application.employer_phone || 'Not provided' },
      { type: 'field', label: 'Length of Employment', value: application.employment_length || 'Not provided' },
      { type: 'field', label: 'Monthly Gross Income', value: formattedIncome }
    ];

    if (application.other_income_sources) {
      content.push({
        type: 'textarea',
        label: 'Other Income Sources',
        value: application.other_income_sources
      });
    }

    return content;
  }

  buildReferencesContent(application) {
    return [
      { type: 'field', label: 'Reference Name', value: application.reference_name || 'Not provided' },
      { type: 'field', label: 'Relationship to Applicant', value: application.reference_relationship || 'Not provided' },
      { type: 'field', label: 'Reference Contact', value: application.reference_contact || 'Not provided' }
    ];
  }

  buildHouseholdInfoContent(application) {
    const content = [
      { type: 'field', label: 'Number of Occupants', value: application.number_of_occupants?.toString() || '1' },
      { type: 'field', label: 'Has Pets', value: application.has_pets ? 'Yes' : 'No' }
    ];

    if (application.has_pets && application.pet_details) {
      content.push({
        type: 'textarea',
        label: 'Pet Details',
        value: application.pet_details
      });
    }

    content.push({ type: 'field', label: 'Has Vehicles', value: application.has_vehicles ? 'Yes' : 'No' });

    if (application.has_vehicles && application.vehicle_details) {
      content.push({
        type: 'textarea',
        label: 'Vehicle Details',
        value: application.vehicle_details
      });
    }

    return content;
  }

  buildBackgroundInfoContent(application) {
    const content = [
      { type: 'field', label: 'Ever Been Evicted', value: application.ever_evicted ? 'Yes' : 'No' }
    ];

    if (application.ever_evicted && application.eviction_details) {
      content.push({
        type: 'textarea',
        label: 'Eviction Details',
        value: application.eviction_details
      });
    }

    content.push({
      type: 'field',
      label: 'Criminal Conviction',
      value: application.criminal_conviction ? 'Yes' : 'No'
    });

    if (application.criminal_conviction && application.conviction_details) {
      content.push({
        type: 'textarea',
        label: 'Conviction Details',
        value: application.conviction_details
      });
    }

    return content;
  }
}

module.exports = new PDFService();