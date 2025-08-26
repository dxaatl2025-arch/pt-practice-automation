const { MongoClient } = require('mongodb'); 
const fs = require('fs'); 
async function backup() { 
  try { 
    const client = new MongoClient(process.env.MONGODB_URI); 
    await client.connect(); 
    console.log('? MongoDB backup would work - connection successful'); 
    await client.close(); 
  } catch(e) { console.error('? Backup failed:', e.message); } 
} 
backup(); 
