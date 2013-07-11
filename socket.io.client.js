//(functino(){
//
//})
socket.on('socketOpened', function(){
   //channelReady true 
   console.log('Socket opened'); 
}); 
socket.on('socketMessage', function(msg){
    console.log('server: '+msg); 

}); 
socket.on('socketError', function(err){

}); 
socket.on('socketClose', function(msg){

}); 
