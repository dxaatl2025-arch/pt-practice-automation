const OwnersService = require('../service/ownersService');
const { validationResult } = require('express-validator');

class OwnersController {
  constructor() {
    this.ownersService = new OwnersService();
  }

  /**
   * Get portfolio summary for authenticated owner
   */
  async getPortfolio(req, res) {
    try {
      // Check feature flag
      if (process.env.OWNER_PORTAL !== 'true') {
        return res.status(501).json({
          success: false,
          error: 'Owner Portal feature is not enabled'
        });
      }

      const ownerId = req.params.ownerId || req.user.id;

      // Verify user can access this owner's data
      if (req.user.role !== 'ADMIN' && req.user.id !== ownerId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: Cannot view other owner\'s portfolio'
        });
      }

      const portfolio = await this.ownersService.getPortfolioSummary(ownerId);

      res.status(200).json({
        success: true,
        data: portfolio
      });

    } catch (error) {
      console.error('Error in getPortfolio:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve portfolio data'
      });
    }
  }

  /**
   * Generate financial report
   */
  async generateReport(req, res) {
    try {
      // Check feature flag
      if (process.env.OWNER_PORTAL !== 'true') {
        return res.status(501).json({
          success: false,
          error: 'Owner Portal feature is not enabled'
        });
      }

      const ownerId = req.params.ownerId || req.user.id;
      const { reportType, startDate, endDate, format = 'json' } = req.body;

      // Verify user can access this owner's data
      if (req.user.role !== 'ADMIN' && req.user.id !== ownerId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: Cannot generate reports for other owners'
        });
      }

      // Validate date inputs
      const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 12));
      const end = endDate ? new Date(endDate) : new Date();

      if (start > end) {
        return res.status(400).json({
          success: false,
          error: 'Start date cannot be after end date'
        });
      }

      const reportOptions = {
        startDate: start,
        endDate: end,
        reportType: reportType || 'monthly'
      };

      const reportData = await this.ownersService.generateFinancialReport(ownerId, reportOptions);

      if (format === 'pdf') {
        const pdfBuffer = await this.ownersService.generatePDFReport(ownerId, reportData);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="portfolio-report-${new Date().toISOString().substring(0, 10)}.pdf"`);
        res.send(pdfBuffer);
      } else {
        res.status(200).json({
          success: true,
          data: reportData
        });
      }

    } catch (error) {
      console.error('Error in generateReport:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate report'
      });
    }
  }

  /**
   * Get maintenance summary
   */
  async getMaintenanceSummary(req, res) {
    try {
      // Check feature flag
      if (process.env.OWNER_PORTAL !== 'true') {
        return res.status(501).json({
          success: false,
          error: 'Owner Portal feature is not enabled'
        });
      }

      const ownerId = req.params.ownerId || req.user.id;

      // Verify user can access this owner's data
      if (req.user.role !== 'ADMIN' && req.user.id !== ownerId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: Cannot view other owner\'s maintenance data'
        });
      }

      const maintenanceSummary = await this.ownersService.getMaintenanceSummary(ownerId);

      res.status(200).json({
        success: true,
        data: maintenanceSummary
      });

    } catch (error) {
      console.error('Error in getMaintenanceSummary:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve maintenance summary'
      });
    }
  }

  /**
   * Get occupancy trends
   */
  async getOccupancyTrends(req, res) {
    try {
      // Check feature flag
      if (process.env.OWNER_PORTAL !== 'true') {
        return res.status(501).json({
          success: false,
          error: 'Owner Portal feature is not enabled'
        });
      }

      const ownerId = req.params.ownerId || req.user.id;
      const months = parseInt(req.query.months) || 12;

      // Verify user can access this owner's data
      if (req.user.role !== 'ADMIN' && req.user.id !== ownerId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: Cannot view other owner\'s occupancy data'
        });
      }

      // Validate months parameter
      if (months < 1 || months > 60) {
        return res.status(400).json({
          success: false,
          error: 'Months parameter must be between 1 and 60'
        });
      }

      const trends = await this.ownersService.getOccupancyTrends(ownerId, months);

      res.status(200).json({
        success: true,
        data: {
          trends,
          metadata: {
            ownerId,
            months,
            generatedAt: new Date()
          }
        }
      });

    } catch (error) {
      console.error('Error in getOccupancyTrends:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve occupancy trends'
      });
    }
  }

  /**
   * Get available reports list
   */
  async getReports(req, res) {
    try {
      // Check feature flag
      if (process.env.OWNER_PORTAL !== 'true') {
        return res.status(501).json({
          success: false,
          error: 'Owner Portal feature is not enabled'
        });
      }

      const ownerId = req.params.ownerId || req.user.id;

      // Verify user can access this owner's data
      if (req.user.role !== 'ADMIN' && req.user.id !== ownerId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      // For now, return available report types
      // In a real implementation, you might want to store historical reports
      const availableReports = [
        {
          type: 'financial',
          name: 'Financial Summary',
          description: 'Income, expenses, and net profit analysis',
          formats: ['json', 'pdf', 'csv']
        },
        {
          type: 'occupancy',
          name: 'Occupancy Analysis',
          description: 'Occupancy rates and vacancy trends',
          formats: ['json', 'pdf']
        },
        {
          type: 'maintenance',
          name: 'Maintenance Report',
          description: 'Maintenance tickets and resolution times',
          formats: ['json', 'pdf']
        },
        {
          type: 'portfolio',
          name: 'Portfolio Overview',
          description: 'Complete portfolio performance summary',
          formats: ['json', 'pdf']
        }
      ];

      res.status(200).json({
        success: true,
        data: {
          availableReports,
          ownerId,
          generatedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Error in getReports:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve reports list'
      });
    }
  }

  /**
   * Download report in specified format
   */
  async downloadReport(req, res) {
    try {
      // Check feature flag
      if (process.env.OWNER_PORTAL !== 'true') {
        return res.status(501).json({
          success: false,
          error: 'Owner Portal feature is not enabled'
        });
      }

      const { ownerId, reportId } = req.params;
      const { format = 'pdf' } = req.query;

      // Verify user can access this owner's data
      if (req.user.role !== 'ADMIN' && req.user.id !== ownerId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      // For demonstration, generate a financial report
      // In a real implementation, you'd retrieve the stored report by ID
      const reportData = await this.ownersService.generateFinancialReport(ownerId);

      if (format === 'pdf') {
        const pdfBuffer = await this.ownersService.generatePDFReport(ownerId, reportData);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="report-${reportId}.pdf"`);
        res.send(pdfBuffer);
      } else if (format === 'csv') {
        // Simple CSV export for financial data
        let csv = 'Type,Amount\n';
        csv += `Total Income,${reportData.financialSummary.totalIncome}\n`;
        csv += `Total Expenses,${reportData.financialSummary.totalExpenses}\n`;
        csv += `Net Income,${reportData.financialSummary.netIncome}\n`;
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="report-${reportId}.csv"`);
        res.send(csv);
      } else {
        res.status(200).json({
          success: true,
          data: reportData
        });
      }

    } catch (error) {
      console.error('Error in downloadReport:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to download report'
      });
    }
  }
}

module.exports = OwnersController;