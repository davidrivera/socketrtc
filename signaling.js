var io = require('socket.io').listen(3000)
  , clients = [];

io.enable('browser client minification'); 
io.static.add('/path/for/socketRTC.client.js',{file:'file.js'});

io.sockets.on('connection', function(socket){
    var addr = socket.handshake.address
      , rand = Math.floor(Math.random()*Date.now()); 

    socket.name = addr.address + ":" + addr.port + ":" + Date.now();  

    // Put this new client in the list
    clients[socket.id] = {'address':socket.name, 'room':rand, 'currentRoom':rand}; 
    socket.join(rand); 

    socket.emit('socketOpened', rand); 
 
    console.log("Connected: "+socket.name);

    socket.on('send', function(msg){
        io.sockets.in(clients[socket.id].currentRoom).emit('socketMessage', msg)
    }); 
    socket.on('disconnect', function(){
        console.log("Disconnect happening"); 
        io.socket.in(cleints[socket.id].currentRoom).emit('bye'); 
        delete(clients[socket.id]); 
    })
    socket.on('message', function(msg){
        io.sockets.in(clients[socket.id].currentRoom).emit('socketMessage', msg)
    })
    socket.on('join', function(room){
        // Here we can check some sort of 1 time session thing
        // we also need to check if they are joining a room that exists
        socket.leave(clients[socket.id].currentRoom); 
        clients[socket.id].currentRoom = room; 
        socket.join(room); 
    })
})
