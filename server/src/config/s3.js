const { S3Client } = require('@aws-sdk/client-s3');

let s3Client = null;

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  const config = {
    region: process.env.S3_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  };

  // Support for S3-compatible services (Cloudflare R2, MinIO, etc.)
  if (process.env.S3_ENDPOINT) {
    config.endpoint = process.env.S3_ENDPOINT;
    config.forcePathStyle = true; // Required for some S3-compatible services
  }

  s3Client = new S3Client(config);
  console.log('✅ S3 client initialized');
} else {
  console.log('⚠️ S3 not configured (missing AWS credentials)');
}

const bucketName = process.env.S3_BUCKET;

module.exports = { s3Client, bucketName };