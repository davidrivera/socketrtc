//(functino(){
//
//})
var handlers = {}

socket.on('socketOpened', function(){
   //channelReady true 
   this.handlers.socketOpened(); 
   console.log('Socket opened'); 
}); 
socket.on('socketMessage', function(msg){
    this.handlers.socketMessage(msg); 
    console.log('server: '+msg); 
}); 
socket.on('socketError', function(err){

}); 
socket.on('socketClose', function(msg){

}); 
function sendMessage(msg){
    socket.emit('message', msg); 
}
