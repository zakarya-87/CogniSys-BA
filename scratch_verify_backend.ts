
import { createApp } from './server/app';
import { logger } from './server/logger';

async function verify() {
  try {
    console.log('--- Initializing CogniSys App ---');
    const app = createApp();
    console.log('--- App Factory Successful ---');
    process.exit(0);
  } catch (error) {
    console.error('--- APP INITIALIZATION FAILED ---');
    console.error(error);
    process.exit(1);
  }
}

verify();
