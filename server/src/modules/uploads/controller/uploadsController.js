const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3Client, bucketName } = require('../../../config/s3');
const { signedUrlSchema } = require('../schemas/uploadsSchemas');
const prisma = require('../../../config/prisma');
const crypto = require('crypto');

class UploadsController {
  
  async createSignedUrl(req, res) {
    try {
      if (!s3Client || !bucketName) {
        return res.status(500).json({
          success: false,
          message: 'S3 not configured'
        });
      }

      const validatedData = signedUrlSchema.parse(req.body);
      const userId = req.user.id;
      const userRole = req.user.role;

      // Authorization check
      await this.checkEntityAccess(validatedData.entityType, validatedData.entityId, userId, userRole);

      // Generate unique key
      const timestamp = Date.now();
      const randomId = crypto.randomBytes(8).toString('hex');
      const extension = this.getFileExtension(validatedData.contentType);
      const key = `${validatedData.entityType}/${validatedData.entityId}/${timestamp}-${randomId}${extension}`;

      // Create presigned URL (expires in 15 minutes)
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        ContentType: validatedData.contentType,
        Metadata: {
          entityType: validatedData.entityType,
          entityId: validatedData.entityId,
          uploadedBy: userId
        }
      });

      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

      // Construct the final URL (for accessing the file after upload)
      const baseUrl = process.env.S3_ENDPOINT || `https://${bucketName}.s3.${process.env.S3_REGION || 'us-east-1'}.amazonaws.com`;
      const fileUrl = `${baseUrl}/${key}`;

      res.json({
        success: true,
        data: {
          uploadUrl: signedUrl,
          fileUrl: fileUrl,
          key: key,
          method: 'PUT',
          headers: {
            'Content-Type': validatedData.contentType
          },
          expiresIn: 900
        }
      });

    } catch (error) {
      console.error('❌ Create signed URL error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create signed URL'
      });
    }
  }

  async checkEntityAccess(entityType, entityId, userId, userRole) {
    switch (entityType) {
      case 'application':
        const application = await prisma.application.findUnique({
          where: { id: entityId },
          include: {
            property: {
              select: { landlordId: true }
            }
          }
        });
        
        if (!application) {
          throw new Error('Application not found');
        }

        // Tenant can upload to their own applications, landlord can upload to their property applications
        if (userRole === 'TENANT' && application.applicantId !== userId) {
          throw new Error('Unauthorized: Not your application');
        }
        if (userRole === 'LANDLORD' && application.property.landlordId !== userId) {
          throw new Error('Unauthorized: Not your property application');
        }
        break;

      case 'property':
        const property = await prisma.property.findUnique({
          where: { id: entityId },
          select: { landlordId: true }
        });
        
        if (!property) {
          throw new Error('Property not found');
        }
        if (property.landlordId !== userId) {
          throw new Error('Unauthorized: Not your property');
        }
        break;

      case 'maintenance':
        const ticket = await prisma.maintenanceTicket.findUnique({
          where: { id: entityId },
          include: {
            property: {
              select: { landlordId: true }
            }
          }
        });
        
        if (!ticket) {
          throw new Error('Maintenance ticket not found');
        }
        
        // Tenant can upload to their tickets, landlord can upload to their property tickets
        if (userRole === 'TENANT' && ticket.tenantId !== userId) {
          throw new Error('Unauthorized: Not your ticket');
        }
        if (userRole === 'LANDLORD' && ticket.property.landlordId !== userId) {
          throw new Error('Unauthorized: Not your property ticket');
        }
        break;

      case 'lease':
        const lease = await prisma.lease.findUnique({
          where: { id: entityId },
          include: {
            property: {
              select: { landlordId: true }
            }
          }
        });
        
        if (!lease) {
          throw new Error('Lease not found');
        }
        
        // Tenant can upload to their lease, landlord can upload to their property lease
        if (userRole === 'TENANT' && lease.tenantId !== userId) {
          throw new Error('Unauthorized: Not your lease');
        }
        if (userRole === 'LANDLORD' && lease.property.landlordId !== userId) {
          throw new Error('Unauthorized: Not your property lease');
        }
        break;

      default:
        throw new Error('Invalid entity type');
    }
  }

  getFileExtension(contentType) {
    const extensions = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'application/pdf': '.pdf',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'text/plain': '.txt'
    };
    
    return extensions[contentType] || '';
  }
}

module.exports = UploadsController;