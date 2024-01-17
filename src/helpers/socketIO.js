const socketIO = (io) => {
  io.on('connection', (socket) => {
    //console.log(`ID: ${socket.id} just connected`);
    socket.on('disconnect', () => {
      console.log(`ID: ${socket.id} disconnected`);
    });
  });
};

module.exports = socketIO;