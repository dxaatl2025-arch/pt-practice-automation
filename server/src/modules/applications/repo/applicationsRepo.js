// server/src/modules/applications/repo/applicationsRepo.js
console.log('🗄️ Applications repository loading...');

// Import Prisma directly - bypass any factory issues
const { PrismaClient } = require('@prisma/client');

// Create Prisma instance directly
let prisma;
try {
  prisma = new PrismaClient();
  console.log('🗄️ Direct Prisma client created successfully');
} catch (error) {
  console.error('❌ Failed to create Prisma client:', error);
  throw error;
}

class ApplicationsRepository {
  constructor() {
    console.log('🗄️ Applications repository initialized');
    
    if (!prisma) {
      throw new Error('Prisma client not available');
    }
    
    // Test the connection
    this.testConnection();
  }

  async testConnection() {
    try {
      await prisma.$queryRaw`SELECT 1 as test`;
      console.log('🗄️ Repository database connection verified');
    } catch (error) {
      console.error('❌ Repository database connection failed:', error);
    }
  }

  async create(data) {
    console.log('🗄️ Repository: Creating application');
    console.log('🗄️ Data keys:', Object.keys(data));
    
    if (!prisma) {
      throw new Error('Prisma client not initialized');
    }

    try {
      const result = await prisma.application.create({
        data,
        include: {
          property: {
            select: { 
              id: true,
              title: true, 
              landlordId: true,
              addressStreet: true,
              addressCity: true,
              addressState: true
            }
          }
        }
      });
      
      console.log('🗄️ Application created successfully:', result.id);
      return result;
    } catch (error) {
      console.error('❌ Prisma create failed:', error);
      console.error('❌ Error details:', error.message);
      throw error;
    }
  }

  async listByProperty(propertyId, { cursor, take = 20, search, status } = {}) {
    console.log('🗄️ Repository: Listing applications for property:', propertyId);
    
    try {
      const where = { propertyId };
      if (status) where.status = status;
      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ];
      }

      const result = await prisma.application.findMany({
        where,
        take,
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
        orderBy: { submittedAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          status: true,
          submittedAt: true,
          monthlyIncome: true,
          occupants: true
        }
      });

      console.log('✅ Applications found:', result.length);
      return result;
    } catch (error) {
      console.error('❌ List applications failed:', error);
      throw error;
    }
  }

  // ADD THIS METHOD - it was missing from your repo
  async countByProperty(propertyId, status = null) {
  console.log('🗄️ Repository: Counting applications for property:', propertyId);
  
  try {
    const where = { propertyId };
    if (status) where.status = status;

    const count = await prisma.application.count({ where });
    
    console.log('✅ Applications count:', count);
    return count;
  } catch (error) {
    console.error('❌ Count applications failed:', error);
    throw error;
  }
}
  async countByProperty(propertyId, status = null) {
    console.log('🗄️ Repository: Counting applications for property:', propertyId);
    
    try {
      const where = { propertyId };
      if (status) where.status = status;

      const count = await prisma.application.count({ where });
      
      console.log('✅ Applications count:', count);
      return count;
    } catch (error) {
      console.error('❌ Count applications failed:', error);
      throw error;
    }
  }

  async get(id) {
    console.log('🗄️ Repository: Getting application:', id);
    
    try {
      const result = await prisma.application.findUnique({
        where: { id },
        include: {
          property: {
            select: { 
              id: true,
              title: true, 
              landlordId: true,
              addressStreet: true,
              addressCity: true,
              addressState: true
            }
          }
        }
      });
      
      console.log('✅ Application retrieved:', result ? 'found' : 'not found');
      return result;
    } catch (error) {
      console.error('❌ Get application failed:', error);
      throw error;
    }
  }

  async updateStatus(id, status, reviewNotes = null) {
    console.log('🗄️ Repository: Updating status for:', id, 'to:', status);
    
    try {
      // Only update the status field - remove reviewedAt and reviewNotes since they don't exist
      const result = await prisma.application.update({
        where: { id },
        data: {
          status
          // Removed reviewedAt and reviewNotes since these fields don't exist in your schema
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          status: true,
          submittedAt: true,
          monthlyIncome: true,
          property: {
            select: { 
              id: true,
              title: true 
            }
          }
        }
      });
      
      console.log('✅ Status updated successfully:', result.id, 'new status:', result.status);
      return result;
    } catch (error) {
      console.error('❌ Status update failed:', error);
      console.error('❌ Error details:', error.message);
      throw error;
    }
  }

  async getWithPropertyAndLandlord(id) {
    console.log('🗄️ Repository: Getting application with landlord info:', id);
    
    try {
      const result = await prisma.application.findUnique({
        where: { id },
        include: {
          property: {
            include: {
              owner: {
                select: { id: true, email: true, firstName: true, lastName: true }
              }
            }
          }
        }
      });
      
      // Transform to match expected structure (service expects .landlord)
      if (result && result.property && result.property.owner) {
        result.property.landlord = result.property.owner;
      }
      
      console.log('✅ Application with landlord retrieved:', result ? 'found' : 'not found');
      return result;
    } catch (error) {
      console.error('❌ Get application with landlord failed:', error);
      throw error;
    }
  }
}

console.log('🗄️ Applications repository class defined');
module.exports = ApplicationsRepository;