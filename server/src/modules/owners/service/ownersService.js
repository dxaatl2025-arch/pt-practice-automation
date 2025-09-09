const { PrismaClient } = require('@prisma/client');
const PDFDocument = require('pdfkit');
const fs = require('fs').promises;
const path = require('path');

class OwnersService {
  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get portfolio summary for an owner
   * @param {string} ownerId - Owner user ID
   * @returns {Promise<Object>} Portfolio summary data
   */
  async getPortfolioSummary(ownerId) {
    try {
      // Get owner's properties
      const properties = await this.prisma.property.findMany({
        where: { ownerId },
        include: {
          leases: {
            where: {
              status: 'ACTIVE'
            },
            include: {
              tenant: {
                select: { id: true, firstName: true, lastName: true, email: true }
              },
              payments: {
                where: {
                  createdAt: {
                    gte: new Date(new Date().setMonth(new Date().getMonth() - 12))
                  }
                },
                select: { amount: true, status: true, dueDate: true, paidDate: true }
              }
            }
          },
          maintenanceTickets: {
            where: {
              status: { not: 'COMPLETED' }
            },
            select: { id: true, title: true, priority: true, status: true }
          }
        }
      });

      // Calculate portfolio metrics
      const totalUnits = properties.length;
      const occupiedUnits = properties.filter(p => p.leases.some(l => l.status === 'ACTIVE')).length;
      const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

      // Calculate monthly rental revenue
      const monthlyRent = properties.reduce((total, property) => {
        const activeLeases = property.leases.filter(l => l.status === 'ACTIVE');
        return total + activeLeases.reduce((sum, lease) => sum + (lease.monthlyRent || 0), 0);
      }, 0);

      // Calculate delinquency
      const currentDate = new Date();
      let totalDelinquent = 0;
      let delinquentTenants = 0;

      properties.forEach(property => {
        property.leases.forEach(lease => {
          const unpaidPayments = lease.payments.filter(p => 
            p.status === 'OVERDUE' && new Date(p.dueDate) < currentDate
          );
          if (unpaidPayments.length > 0) {
            delinquentTenants++;
            totalDelinquent += unpaidPayments.reduce((sum, p) => sum + p.amount, 0);
          }
        });
      });

      const delinquencyRate = occupiedUnits > 0 ? (delinquentTenants / occupiedUnits) * 100 : 0;

      // Count open maintenance tickets
      const openMaintenanceTickets = properties.reduce((total, property) => 
        total + property.maintenanceTickets.length, 0
      );

      return {
        summary: {
          totalUnits,
          occupiedUnits,
          vacantUnits: totalUnits - occupiedUnits,
          occupancyRate: Math.round(occupancyRate * 100) / 100,
          monthlyRent,
          annualRent: monthlyRent * 12,
          delinquencyRate: Math.round(delinquencyRate * 100) / 100,
          totalDelinquent,
          delinquentTenants,
          openMaintenanceTickets
        },
        properties: properties.map(property => ({
          id: property.id,
          title: property.title || `Property ${property.id}`,
          address: `${property.addressCity}, ${property.addressState}`,
          type: property.propertyType,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          isOccupied: property.leases.some(l => l.status === 'ACTIVE'),
          monthlyRent: property.leases
            .filter(l => l.status === 'ACTIVE')
            .reduce((sum, l) => sum + (l.monthlyRent || 0), 0),
          tenant: property.leases.find(l => l.status === 'ACTIVE')?.tenant || null,
          maintenanceIssues: property.maintenanceTickets.length
        }))
      };
    } catch (error) {
      console.error('Error getting portfolio summary:', error);
      throw new Error('Failed to retrieve portfolio summary');
    }
  }

  /**
   * Generate financial report for owner
   * @param {string} ownerId - Owner user ID
   * @param {Object} options - Report options
   * @returns {Promise<Object>} Report data
   */
  async generateFinancialReport(ownerId, options = {}) {
    const {
      startDate = new Date(new Date().setMonth(new Date().getMonth() - 12)),
      endDate = new Date(),
      reportType = 'monthly'
    } = options;

    try {
      // Get owner's properties
      const properties = await this.prisma.property.findMany({
        where: { ownerId },
        include: {
          leases: {
            include: {
              payments: {
                where: {
                  createdAt: {
                    gte: startDate,
                    lte: endDate
                  }
                }
              }
            }
          },
          expenses: {
            where: {
              createdAt: {
                gte: startDate,
                lte: endDate
              }
            }
          }
        }
      });

      // Aggregate financial data
      let totalIncome = 0;
      let totalExpenses = 0;
      const monthlyData = {};
      const incomeByProperty = {};
      const expensesByCategory = {};

      properties.forEach(property => {
        incomeByProperty[property.id] = {
          title: property.title || `Property ${property.id}`,
          income: 0,
          expenses: 0
        };

        // Calculate rental income
        property.leases.forEach(lease => {
          lease.payments.forEach(payment => {
            if (payment.status === 'PAID' || payment.status === 'COMPLETED') {
              const amount = payment.amount || 0;
              totalIncome += amount;
              incomeByProperty[property.id].income += amount;

              // Group by month for trend analysis
              const monthKey = payment.paidDate 
                ? payment.paidDate.toISOString().substring(0, 7) 
                : payment.createdAt.toISOString().substring(0, 7);
              
              if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { income: 0, expenses: 0 };
              }
              monthlyData[monthKey].income += amount;
            }
          });
        });

        // Calculate expenses
        property.expenses?.forEach(expense => {
          const amount = expense.amount || 0;
          totalExpenses += amount;
          incomeByProperty[property.id].expenses += amount;

          const category = expense.category || 'Other';
          expensesByCategory[category] = (expensesByCategory[category] || 0) + amount;

          const monthKey = expense.createdAt.toISOString().substring(0, 7);
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { income: 0, expenses: 0 };
          }
          monthlyData[monthKey].expenses += amount;
        });
      });

      // Calculate net income and profitability
      const netIncome = totalIncome - totalExpenses;
      const profitMargin = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0;

      // Create monthly trend data
      const trendData = Object.keys(monthlyData)
        .sort()
        .map(month => ({
          month,
          income: monthlyData[month].income,
          expenses: monthlyData[month].expenses,
          netIncome: monthlyData[month].income - monthlyData[month].expenses
        }));

      return {
        reportMetadata: {
          ownerId,
          startDate,
          endDate,
          reportType,
          generatedAt: new Date(),
          propertiesCount: properties.length
        },
        financialSummary: {
          totalIncome: Math.round(totalIncome * 100) / 100,
          totalExpenses: Math.round(totalExpenses * 100) / 100,
          netIncome: Math.round(netIncome * 100) / 100,
          profitMargin: Math.round(profitMargin * 100) / 100,
          averageMonthlyIncome: trendData.length > 0 ? 
            Math.round((totalIncome / trendData.length) * 100) / 100 : 0
        },
        incomeByProperty: Object.values(incomeByProperty),
        expensesByCategory,
        trendData
      };
    } catch (error) {
      console.error('Error generating financial report:', error);
      throw new Error('Failed to generate financial report');
    }
  }

  /**
   * Generate PDF report
   * @param {string} ownerId - Owner user ID
   * @param {Object} reportData - Report data
   * @returns {Promise<Buffer>} PDF buffer
   */
  async generatePDFReport(ownerId, reportData) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument();
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // Add header
        doc.fontSize(20).text('Property Portfolio Report', 50, 50);
        doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`, 50, 80);
        doc.moveDown();

        // Add financial summary
        doc.fontSize(16).text('Financial Summary', 50, 120);
        doc.fontSize(12);
        doc.text(`Total Income: $${reportData.financialSummary.totalIncome.toLocaleString()}`, 50, 150);
        doc.text(`Total Expenses: $${reportData.financialSummary.totalExpenses.toLocaleString()}`, 50, 170);
        doc.text(`Net Income: $${reportData.financialSummary.netIncome.toLocaleString()}`, 50, 190);
        doc.text(`Profit Margin: ${reportData.financialSummary.profitMargin}%`, 50, 210);

        // Add property breakdown
        doc.fontSize(16).text('Income by Property', 50, 250);
        let yPosition = 280;
        reportData.incomeByProperty.forEach(property => {
          doc.fontSize(12).text(
            `${property.title}: $${property.income.toLocaleString()} (Net: $${(property.income - property.expenses).toLocaleString()})`,
            50, yPosition
          );
          yPosition += 20;
        });

        // Add expenses breakdown
        doc.fontSize(16).text('Expenses by Category', 50, yPosition + 20);
        yPosition += 50;
        Object.entries(reportData.expensesByCategory).forEach(([category, amount]) => {
          doc.fontSize(12).text(`${category}: $${amount.toLocaleString()}`, 50, yPosition);
          yPosition += 20;
        });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get maintenance summary for owner
   * @param {string} ownerId - Owner user ID
   * @returns {Promise<Object>} Maintenance summary
   */
  async getMaintenanceSummary(ownerId) {
    try {
      const tickets = await this.prisma.maintenanceTicket.findMany({
        where: {
          property: {
            ownerId
          }
        },
        include: {
          property: {
            select: { id: true, title: true }
          },
          tenant: {
            select: { id: true, firstName: true, lastName: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      const summary = {
        total: tickets.length,
        open: tickets.filter(t => t.status !== 'COMPLETED').length,
        inProgress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
        completed: tickets.filter(t => t.status === 'COMPLETED').length,
        highPriority: tickets.filter(t => t.priority === 'HIGH' && t.status !== 'COMPLETED').length,
        averageResolutionTime: 0, // Would need to calculate based on created/completed dates
        recentTickets: tickets.slice(0, 10).map(ticket => ({
          id: ticket.id,
          title: ticket.title,
          property: ticket.property.title || `Property ${ticket.property.id}`,
          tenant: ticket.tenant ? 
            `${ticket.tenant.firstName} ${ticket.tenant.lastName}` : 
            'N/A',
          priority: ticket.priority,
          status: ticket.status,
          createdAt: ticket.createdAt,
          updatedAt: ticket.updatedAt
        }))
      };

      return summary;
    } catch (error) {
      console.error('Error getting maintenance summary:', error);
      throw new Error('Failed to retrieve maintenance summary');
    }
  }

  /**
   * Get occupancy trends
   * @param {string} ownerId - Owner user ID
   * @param {number} months - Number of months to analyze
   * @returns {Promise<Array>} Occupancy trend data
   */
  async getOccupancyTrends(ownerId, months = 12) {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      // This is a simplified version - in a real implementation,
      // you'd want to track historical occupancy data
      const properties = await this.prisma.property.findMany({
        where: { ownerId },
        include: {
          leases: {
            where: {
              OR: [
                { startDate: { gte: startDate } },
                { endDate: { gte: startDate } },
                { status: 'ACTIVE' }
              ]
            }
          }
        }
      });

      // Generate mock trend data (replace with real historical data)
      const trends = [];
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = date.toISOString().substring(0, 7);

        // Calculate occupancy for this month (simplified)
        const totalUnits = properties.length;
        const occupiedUnits = properties.filter(property => 
          property.leases.some(lease => 
            lease.status === 'ACTIVE' || 
            (lease.startDate <= date && (!lease.endDate || lease.endDate >= date))
          )
        ).length;

        trends.push({
          month: monthKey,
          totalUnits,
          occupiedUnits,
          vacantUnits: totalUnits - occupiedUnits,
          occupancyRate: totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0
        });
      }

      return trends;
    } catch (error) {
      console.error('Error getting occupancy trends:', error);
      throw new Error('Failed to retrieve occupancy trends');
    }
  }
}

module.exports = OwnersService;