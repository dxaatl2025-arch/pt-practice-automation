// Mock S3 service for testing
const mockS3Service = {
  uploadedFiles: new Map(),
  signedUrls: [],
  shouldFail: false,
  failureMessage: 'Mock S3 error'
};

// Mock AWS SDK v3 classes
class MockPutObjectCommand {
  constructor(params) {
    this.input = params;
  }
}

const mockGetSignedUrl = async (s3Client, command, options) => {
  console.log(`📁 [MOCK] Generating signed URL for bucket: ${command.input.Bucket}, key: ${command.input.Key}`);
  
  if (mockS3Service.shouldFail) {
    throw new Error(mockS3Service.failureMessage);
  }

  const signedUrlData = {
    bucket: command.input.Bucket,
    key: command.input.Key,
    contentType: command.input.ContentType,
    metadata: command.input.Metadata,
    expiresIn: options?.expiresIn || 3600,
    createdAt: new Date()
  };

  const mockUrl = `https://mock-s3-endpoint.com/${command.input.Bucket}/${command.input.Key}?signed=true&expires=${Date.now() + (options?.expiresIn || 3600) * 1000}`;
  
  mockS3Service.signedUrls.push({
    ...signedUrlData,
    url: mockUrl
  });

  return mockUrl;
};

class MockS3Client {
  constructor(config) {
    this.config = config;
    console.log(`📁 [MOCK] S3 client initialized with region: ${config.region}`);
  }
}

const mockS3Client = new MockS3Client({
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: 'mock-access-key',
    secretAccessKey: 'mock-secret-key'
  }
});

const bucketName = process.env.S3_BUCKET || 'mock-test-bucket';

// Test utilities
const __testUtils = {
  getSignedUrls: () => mockS3Service.signedUrls,
  getLastSignedUrl: () => mockS3Service.signedUrls[mockS3Service.signedUrls.length - 1],
  clearSignedUrls: () => { mockS3Service.signedUrls = []; },
  getUploadedFiles: () => Array.from(mockS3Service.uploadedFiles.values()),
  clearUploadedFiles: () => { mockS3Service.uploadedFiles.clear(); },
  setShouldFail: (shouldFail, message) => {
    mockS3Service.shouldFail = shouldFail;
    if (message) mockS3Service.failureMessage = message;
  },
  simulateFileUpload: (key, contentType, size = 1024) => {
    const fileData = {
      key,
      contentType,
      size,
      uploadedAt: new Date(),
      etag: `"mock-etag-${Math.random().toString(36).substr(2, 16)}"`
    };
    mockS3Service.uploadedFiles.set(key, fileData);
    return fileData;
  },
  findSignedUrlByKey: (key) => mockS3Service.signedUrls.find(url => url.key === key)
};

module.exports = {
  s3Client: mockS3Client,
  bucketName,
  PutObjectCommand: MockPutObjectCommand,
  getSignedUrl: mockGetSignedUrl,
  __testUtils
};