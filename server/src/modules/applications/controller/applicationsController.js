// server/src/modules/applications/controller/applicationsController.js
// UPDATED VERSION to work with enhanced service

const ApplicationsService = require('../service/applicationsService');

class ApplicationsController {
  constructor() {
    this.applicationsService = new ApplicationsService();
  }

  async submitApplication(req, res) {
    try {
      const result = await this.applicationsService.submitApplication(req.body);
      
      res.status(201).json({
        success: true,
        data: result,
        message: 'Application submitted successfully'
      });
    } catch (error) {
      console.error('Submit application error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // UPDATED: Now passes landlordId for ownership verification
  async listApplications(req, res) {
  try {
    const { propertyId, status, page = 1, limit = 10 } = req.query;
    const landlordId = req.user.uid; // Firebase UID
    
    console.log('📋 Listing applications for Firebase user:', landlordId);

    if (!propertyId) {
      return res.status(400).json({
        success: false,
        error: 'Property ID is required'
      });
    }

    const result = await this.applicationsService.listForLandlord(
      landlordId, 
      propertyId, 
      { status, page: parseInt(page), limit: parseInt(limit) }
    );

    res.json({
      success: true,
      data: result,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('List applications error:', error);
    const statusCode = error.message.includes('Unauthorized') ? 403 : 
                      error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
}

  async getApplication(req, res) {
    try {
      const { id } = req.params;
      const application = await this.applicationsService.applicationsRepo.get(id);
      
      if (!application) {
        return res.status(404).json({
          success: false,
          error: 'Application not found'
        });
      }

      res.json({
        success: true,
        data: application
      });
    } catch (error) {
      console.error('Get application error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // UPDATED: Now passes landlordId for ownership verification
  async updateStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, reviewNotes } = req.body;
    const landlordId = req.user.uid; // Firebase UID
    
    console.log('📝 Updating status for Firebase user:', landlordId);

    const updated = await this.applicationsService.setStatus(
      landlordId,
      id, 
      status, 
      reviewNotes
    );

    res.json({
      success: true,
      data: updated,
      message: `Application ${status.toLowerCase()} successfully`
    });
  } catch (error) {
    console.error('Update status error:', error);
    const statusCode = error.message.includes('Unauthorized') ? 403 : 
                      error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
}

  // UPDATED: Now uses generatePdfForLandlord with ownership verification
  async downloadPdf(req, res) {
    try {
      const { id } = req.params;
      const landlordId = req.user.id; // from auth middleware

      // Use new method with ownership verification if available
      const pdfBuffer = this.applicationsService.generatePdfForLandlord 
        ? await this.applicationsService.generatePdfForLandlord(landlordId, id)
        : await this.applicationsService.generatePdf(id);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="application-${id}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Download PDF error:', error);
      const statusCode = error.message.includes('Unauthorized') ? 403 : 
                        error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }
}

// Export singleton instance
module.exports = new ApplicationsController();