import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

async function test() {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const saMatch = envContent.match(/FIREBASE_SERVICE_ACCOUNT=['"]?(\{.*?\})['"]?/s);
    
    if (!saMatch) {
      console.error('Could not find FIREBASE_SERVICE_ACCOUNT in .env.local');
      return;
    }

    let saString = saMatch[1];
    const serviceAccount = JSON.parse(saString);
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    console.log('Testing connection for Project ID:', serviceAccount.project_id);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });

    const db = admin.firestore();
    console.log('Fetching collections...');
    const collections = await db.listCollections();
    console.log('Successfully connected!');
    console.log('Collections count:', collections.length);
    collections.forEach(c => console.log(' -', c.id));

  } catch (err: any) {
    console.error('CONNECTION FAILED:');
    console.error('Error Code:', err.code);
    console.error('Error Message:', err.message);
    if (err.stack) console.error(err.stack);
  }
}

test();
