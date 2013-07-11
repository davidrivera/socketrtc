var servers = {
    'iceServers':[{'url':'stun:stun.1.google.com:19302'}]
}; 

module.exports = exports = RTC = {}; 

var constraints = {
    'mandatory':{
        'OfferToReceiveAudio':true, 
        'OfferToReceiveVideo':true}}; 
var socket;  

RTC.prototype.init = function(options){
    RTC.localStream = options.localStream; 
    RTC.remoteVideo = options.remoteVideo; 
    RTC.constraints = options.constraints; 
    RTC.miniVideo = options.miniVideo; 

    this.socket = io.connect(options.signalingServer); 
}
RTC.prototype.setTurnServer = function(turn){
    var turnServer = turn; 
    if(!turnServer){
       var turnServer = {
            'username':'test', 
            'password':'1234', 
            'ttl':86400,
            'uris':[
                    'turn:127.0.0.1?transport=udp'
                ]}; 
    }

    var iceServer = createIceServer(turnServer.uris[0], turnServer.username, 
            turnServer.password); 
    if(iceServer != null){
        servers.iceServers.push(iceServer); 
    }
}
RTC.prototype.attachElement = function(local remote){

}
RTC.prototype.startCall = function(){
    if(socket &&)
}
function call(){
    console.log('Creating PeerConnection'); 
    createPeerConnection(); 
}
function createPeerConnection(){
    try{
        pc = new RTCPeerConnection(server, constraints); 
        pc.onicecanidate = onIceCandidate;  
    }catch(e){
       //peer connection failed 
    }
    pc.onaddstream      = onRemoteStreamAdded; 
    pc.onremovestream   = onRemoteStreamRemoved; 
}
function onIceCandidate(event) {
    if (event.candidate) {
      sendMessage({type: 'candidate',
                   label: event.candidate.sdpMLineIndex,
                   id: event.candidate.sdpMid,
                   candidate: event.candidate.candidate});
    } else {
      console.log('End of candidates.');
    }
}
