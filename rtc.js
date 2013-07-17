(function(window, undefined){

    var servers = {
        'iceServers':[{'url':'stun:stun.1.google.com:19302'}]
    }; 

    module.exports = exports = RTC = {}; 

    var offerConstraints = {
        'optional':[], 
        'mandatory':{}
    }
    var sdpconstraints = {
        'mandatory':{
            'OfferToReceiveAudio':true, 
            'OfferToReceiveVideo':true}}; 
    var socket
      , msgQueue =[]; 
    var stereo = false;
    RTC.prototype.init = function(options){
        RTC.localVideo = document.getElementById(options.localVideo); 
        RTC.remoteVideo = document.getElementById(options.remoteVideo); 
        RTC.constraints = options.constraints; 
        RTC.miniVideo = options.miniVideo; 

        this.socket = io.connect(options.signalingServer); 
        this.handler = {
            'socketMessage':onSocketMessage
        }
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
    //LOCAL RIGHT NOW
    RTC.prototype.attachElements = function(local, remote, options){
        var mediaConstraints = {
            'audio':true, 
            'video':{
                'mandatory':{}, 
                'optional':[]
            }
        }; 

        try{
            getUserMedia(mediaConstraints, onUserMediaSuccess, 
                         onUserMediaError); 
        }catch(e){
            console.log(e.message); 
        }

    }
    RTC.prototype.startCall = function(){
        initiator = true; 
        if(socket &&){
        }
        createPeerConnection(); 
        this.RTC.peerConnection.addStream(this.RTC.localStream); 

        createOffer(); 
    }
    RTC.prototype.pickUp = function(){
        while (msgQueue.length > 0) {
          processSignalingMessage(msgQueue.shift());
        }
    }
    function onSocketMessage(packet){
        var pkt = JSON.parse(packet); 

        if(pkt.type == 'offer'){
            msgQueue.unshift(pkt); 
        }else{//jfkdsljflksdfkdjfsflkdjsjkl
            msgQueue.push(pkt); 
        }
    }
    function call(){
        console.log('Creating PeerConnection'); 
        createPeerConnection(); 
    }
    function createPeerConnection(){
        try{
            this.RTC.peerConnection = new RTCPeerConnection(server, constraints); 
            this.RTC.peerConnection.onicecanidate = onIceCandidate;  
        }catch(e){
           //peer connection failed 
        }
        this.RTC.peerConnection.onaddstream      = onRemoteStreamAdded; 
        this.RTC.peerConnection.onremovestream   = onRemoteStreamRemoved; 
    }
    function createOffer(){
        var constraints = mergeConstraints(this.OfferConstraints, 
                                           this.sdpConstraints); 
        this.RTC.peerConnection.createOffer(setLocalAndSendMessage, null, constraints); 
    }
    function setLocalAndSendMessage(descriptor){
        descriptor.sdp = preferOpus(descriptor.sdp); 
        this.RTC.peerConnection.seLocalDescription(descriptor); 
        sendMessage(descriptor); 
    }
    function mergeConstrains(cons1, cons2){
        var merge = cons1; 
        for(var name in cons2.mandatory){
            merged.mandatory[name] = cons2.manadatory[name]; 
        }
        merged.optional.concat(cons2.optional); 
        return merged; 
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
    function onUserMediaSuccess(stream){
        attachMediaStream(this.RTC.localVideo, stream); 
        localVideo.style.opacity = 1; 
        this.RTC.localStream = stream; 
    }
    function onUserMediaError(error){
        console.log("There was an error!")
    }
    function processSignalingMessage(message){

        if (message.type === 'offer') {
          // Set Opus in Stereo, if stereo enabled.
          if (stereo)
            message.sdp = addStereo(message.sdp);
          this.RTC.peerConnection.setRemoteDescription(new RTCSessionDescription(message));
          doAnswer();
        } else if (message.type === 'answer') {
          // Set Opus in Stereo, if stereo enabled.
          if (stereo)
            message.sdp = addStereo(message.sdp);
          this.RTC.peerConnection.setRemoteDescription(new RTCSessionDescription(message));
        } else if (message.type === 'candidate') {
          var candidate = new RTCIceCandidate({sdpMLineIndex: message.label,
                                               candidate: message.candidate});
          this.RTC.peerConnection.addIceCandidate(candidate);
        } else if (message.type === 'bye') {
          onRemoteHangup();
        }
    }
    // Set Opus as the default audio codec if it's present.
      function preferOpus(sdp) {
        var sdpLines = sdp.split('\r\n');

        // Search for m line.
        for (var i = 0; i < sdpLines.length; i++) {
            if (sdpLines[i].search('m=audio') !== -1) {
              var mLineIndex = i;
              break;
            }
        }
        if (mLineIndex === null)
          return sdp;

        // If Opus is available, set it as the default in m line.
        for (var i = 0; i < sdpLines.length; i++) {
          if (sdpLines[i].search('opus/48000') !== -1) {
            var opusPayload = extractSdp(sdpLines[i], /:(\d+) opus\/48000/i);
            if (opusPayload)
              sdpLines[mLineIndex] = setDefaultCodec(sdpLines[mLineIndex],
                                                     opusPayload);
            break;
          }
        }

        // Remove CN in m line and sdp.
        sdpLines = removeCN(sdpLines, mLineIndex);

        sdp = sdpLines.join('\r\n');
        return sdp;
      }
      function extractSdp(sdpLine, pattern) {
        var result = sdpLine.match(pattern);
        return (result && result.length == 2)? result[1]: null;
      }
    function addStereo(sdp) {
        var sdpLines = sdp.split('\r\n');

        // Find opus payload.
        for (var i = 0; i < sdpLines.length; i++) {
          if (sdpLines[i].search('opus/48000') !== -1) {
            var opusPayload = extractSdp(sdpLines[i], /:(\d+) opus\/48000/i);
            break;
          }
        }

        // Find the payload in fmtp line.
        for (var i = 0; i < sdpLines.length; i++) {
          if (sdpLines[i].search('a=fmtp') !== -1) {
            var payload = extractSdp(sdpLines[i], /a=fmtp:(\d+)/ );
            if (payload === opusPayload) {
              var fmtpLineIndex = i;
              break;
            }
          }
        }
        // No fmtp line found.
        if (fmtpLineIndex === null)
          return sdp;

        // Append stereo=1 to fmtp line.
        sdpLines[fmtpLineIndex] = sdpLines[fmtpLineIndex].concat(' stereo=1');

        sdp = sdpLines.join('\r\n');
        return sdp;
      }
    function setDefaultCodec(mLine, payload) {
        var elements = mLine.split(' ');
        var newLine = new Array();
        var index = 0;
        for (var i = 0; i < elements.length; i++) {
          if (index === 3) // Format of media starts from the fourth.
            newLine[index++] = payload; // Put target payload to the first.
          if (elements[i] !== payload)
            newLine[index++] = elements[i];
        }
        return newLine.join(' ');
      }
      
      window.RTC = RTC;
}