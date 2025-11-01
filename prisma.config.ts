import { defineConfig } from '@prisma/config';
import * as dotenv from 'dotenv';

dotenv.config(); // ensures .env variables are loaded

export default defineConfig({
  seed: {
    command: 'ts-node prisma/seed.ts',
  },
});
