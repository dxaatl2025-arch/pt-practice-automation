// tests/setup.js - Test environment setup 
process.env.NODE_ENV = 'test'; 
process.env.DB_TARGET = 'mongo'; 
jest.setTimeout(15000); 
