function connection(socket, io) {
    socket.join('general');
    socket.emit('message', { roomName: 'general', content: 'Welcome to the chat room!' });
    socket.on('message', (message) => {
        console.log(message, socket.request.session.user);
        
        io.to('general').emit('message', { sender: socket.request.session.user, date: message.currentTime, roomName: 'general', content: message.content });
    }
)};

module.exports = {
    connection
};