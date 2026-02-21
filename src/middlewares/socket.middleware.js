export const registerUserSocket = (io) => {
  io.on('connection', (socket) => {
    // userId is sent from frontend after login
    socket.on('joinRoom', (userId) => {
      socket.join(`user_${userId}`);
    });
  });
};
