module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('✅ New client connected:', socket.id);
    console.log('🔐 Auth data:', socket.handshake.auth);

    // Send welcome message
    socket.emit('welcome', { 
      message: 'Connected to Creative Design Networks', 
      socketId: socket.id 
    });

    // Join node room
    socket.on('join-node', (nodeId) => {
      socket.join(`node-${nodeId}`);
      console.log(`📡 Socket ${socket.id} joined node-${nodeId}`);
      
      // Notify others in the room
      socket.to(`node-${nodeId}`).emit('user-joined', {
        socketId: socket.id,
        timestamp: new Date()
      });
    });

    // Leave node room
    socket.on('leave-node', (nodeId) => {
      socket.leave(`node-${nodeId}`);
      console.log(`📡 Socket ${socket.id} left node-${nodeId}`);
    });

    // Handle node updates
    socket.on('node-update', (data) => {
      console.log('📝 Node update:', data.nodeId);
      socket.to(`node-${data.nodeId}`).emit('node-updated', {
        ...data,
        socketId: socket.id,
        timestamp: new Date()
      });
    });

    // Handle cursor movements
    socket.on('cursor-move', (data) => {
      socket.to(`node-${data.nodeId}`).emit('cursor-moved', {
        ...data,
        socketId: socket.id,
        timestamp: new Date()
      });
    });

    // Handle chat messages
    socket.on('chat-message', (data) => {
      console.log('💬 Chat message:', data.nodeId);
      io.to(`node-${data.nodeId}`).emit('new-chat-message', {
        ...data,
        socketId: socket.id,
        timestamp: new Date()
      });
    });

    // Handle node creation
    socket.on('node-created', (data) => {
      console.log('✨ New node created:', data.workspaceId);
      socket.to(`workspace-${data.workspaceId}`).emit('new-node', {
        ...data,
        socketId: socket.id,
        timestamp: new Date()
      });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log('❌ Client disconnected:', socket.id, 'Reason:', reason);
      
      // Clean up rooms
      socket.rooms.forEach(room => {
        if (room !== socket.id) {
          socket.to(room).emit('user-left', {
            socketId: socket.id,
            timestamp: new Date()
          });
        }
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('⚠️ Socket error:', error);
    });
  });
};