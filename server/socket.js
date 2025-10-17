const { Server } = require('socket.io');

/**
 * Initialize a Socket.IO server instance and bind reservation-specific helpers.
 *
 * @param {import('http').Server} httpServer - HTTP server created from the Express app.
 * @returns {Server} Configured Socket.IO server instance.
 */
function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN?.split(',') || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

module.exports = {
  initSocket,
};
