import http from 'http';
import { app } from './app.js';
import { setupSocketServer } from './socket/socket.server.js';
import { env } from './config/env.js';

const server = http.createServer(app);

// Attach Socket.IO
const io = setupSocketServer(server);

server.listen(env.PORT, () => {
  console.log('========================================================');
  console.log(`🚀 PulseChat API server running on http://localhost:${env.PORT}`);
  console.log(`🔌 Socket.IO endpoint active with CORS for: ${env.CLIENT_URL}`);
  console.log(`🌐 Environment: ${env.NODE_ENV}`);
  console.log('========================================================');
});

// Handle graceful shutdown
const shutdown = () => {
  console.log('\nShutting down server gracefully...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
