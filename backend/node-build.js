import dotenv from 'dotenv';
dotenv.config();

import { connectDB, createStandaloneServer } from './index.js';

const PORT = Number(process.env.PORT);

async function main() {
  try {
    if (!Number.isFinite(PORT) || PORT <= 0) {
      throw new Error('PORT is required');
    }

    await connectDB();
    const { server } = createStandaloneServer();

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();

