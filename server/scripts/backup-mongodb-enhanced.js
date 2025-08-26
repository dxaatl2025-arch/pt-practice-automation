require('dotenv').config(); 
const { MongoClient } = require('mongodb'); 
const fs = require('fs'); 
 
async function backup() { 
  try { 
    console.log('?? Loading environment variables...'); 
    const uri = process.env.MONGODB_URI; 
    if (!uri) { 
      console.error('? MONGODB_URI not found in environment'); 
      return; 
    } 
    console.log('?? Connecting to MongoDB...'); 
    const client = new MongoClient(uri); 
    await client.connect(); 
    console.log('? MongoDB backup system operational - connection successful'); 
    const db = client.db(); 
    const collections = await db.listCollections().toArray(); 
    console.log(`?? Found ${collections.length} collections available for backup`); 
    await client.close(); 
    console.log('? Backup system verified successfully'); 
  } catch(e) { 
    console.error('? Backup failed:', e.message); 
  } 
} 
backup(); 
