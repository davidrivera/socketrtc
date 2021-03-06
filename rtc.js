(function(window, undefined){

    var servers = {
        'iceServers':[{'url':'stun:stun.1.google.com:19302'}]
    }; 

    // Map over RTC
    var _RTC = window.RTC;

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

    RTC = (function(){
      var mediaConstraints
        , offerConstraints

      onSocketMessage = function (packet){
        var pkt = JSON.parse(packet); 

        if(pkt.type == 'offer'){
            msgQueue.unshift(pkt); 
        }else{
            msgQueue.push(pkt); 
        }
      };
      call = function (){
          console.log('Creating PeerConnection'); 
          createPeerConnection(); 
      };
      createPeerConnection = function (){
          try{
              this.RTC.peerConnection = new RTCPeerConnection(server, constraints); 
              this.RTC.peerConnection.onicecanidate = onIceCandidate;  
          }catch(e){
             //peer connection failed 
          }
          this.RTC.peerConnection.onaddstream      = onRemoteStreamAdded; 
          this.RTC.peerConnection.onremovestream   = onRemoteStreamRemoved; 
      };
      createOffer = function (){
          var constraints = mergeConstraints(this.OfferConstraints, 
                                             this.sdpConstraints); 
          this.RTC.peerConnection.createOffer(setLocalAndSendMessage, null, constraints); 
      };
      setLocalAndSendMessage = function (descriptor){
          descriptor.sdp = preferOpus(descriptor.sdp); 
          this.RTC.peerConnection.seLocalDescription(descriptor); 
          sendMessage(descriptor); 
      };
      mergeConstrains = function (cons1, cons2){
          var merge = cons1; 
          for(var name in cons2.mandatory){
              merged.mandatory[name] = cons2.manadatory[name]; 
          }
          merged.optional.concat(cons2.optional); 
          return merged; 
      };
      onIceCandidate = function (event) {
          if (event.candidate) {
            sendMessage({type: 'candidate',
                         label: event.candidate.sdpMLineIndex,
                         id: event.candidate.sdpMid,
                         candidate: event.candidate.candidate});
          } else {
            console.log('End of candidates.');
          }
      };
      onUserMediaSuccess = function (stream){
          attachMediaStream(this.RTC.localVideo, stream); 
          localVideo.style.opacity = 1; 
          this.RTC.localStream = stream; 
      };
      onUserMediaError = function (error){
          console.log("There was an error!")
      };
      processSignalingMessage = function (message){

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
      };
      // Set Opus as the default audio codec if it's present.
      preferOpus = function (sdp) {
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
      };
      extractSdp =function (sdpLine, pattern) {
        var result = sdpLine.match(pattern);
        return (result && result.length == 2)? result[1]: null;
      };
      addStereo = function (sdp) {
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
      };
      setDefaultCodec = function (mLine, payload) {
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
      };
      getLocalMedia = function(){
        try{
            getUserMedia(this.mediaConstraints,mediaSuccess,mediaFail);
        }catch(e){

        }
      };
      mediaSuccess = function(stream){
          attachMediaStream(this.localVideo,stream);
          localVideo,style,opacity = 1;
          localStream = stream;
      };
      mediaFail = function(err){

      };
      return {
        init: function (options){
          this.localVideo = document.getElementById(options.localVideo); 
          this.remoteVideo = document.getElementById(options.remoteVideo); 
          this.mediaConstraints = options.constraints; 
          this.miniVideo = options.miniVideo; 

          this.socket = io.connect(options.signalingServer); 
          this.handler = {
              'socketMessage':onSocketMessage
          }
          this.attachElement(options.constraints, mediaSuccess, mediaFail);
        },
        setTurnServer: function(turn){
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
        },
        attachElement: function(constraints, success, fail){
          var mediaConstraints = {
              'audio':true, 
              'video':{
                  'mandatory':{}, 
                  'optional':[]
              }
          }; 

          try{
              getUserMedia(constraints, success, 
                           fail); 
          }catch(e){
              console.log(e.message); 
          }
        },
        startCall: function(){
          initiator = true; 
          if(socket && false){
          }
          createPeerConnection(); 
          this.RTC.peerConnection.addStream(this.RTC.localStream); 

          createOffer(); 
        },
        pickUp: function(){
            while (msgQueue.length > 0) {
              processSignalingMessage(msgQueue.shift());
            }
        } 
      };
    })();

    /** Adapter.js */
    var RTCPeerConnection = null;
    var getUserMedia = null;
    var attachMediaStream = null;
    var reattachMediaStream = null;
    var webrtcDetectedBrowser = null;
    var webrtcDetectedVersion = null;

    function trace(text) {
      // This function is used for logging.
      if (text[text.length - 1] == '\n') {
        text = text.substring(0, text.length - 1);
      }
      console.log((performance.now() / 1000).toFixed(3) + ": " + text);
    }

    if (navigator.mozGetUserMedia) {
      console.log("This appears to be Firefox");

      webrtcDetectedBrowser = "firefox";

      webrtcDetectedVersion =
                      parseInt(navigator.userAgent.match(/Firefox\/([0-9]+)\./)[1]);

      // The RTCPeerConnection object.
      RTCPeerConnection = mozRTCPeerConnection;

      // The RTCSessionDescription object.
      RTCSessionDescription = mozRTCSessionDescription;

      // The RTCIceCandidate object.
      RTCIceCandidate = mozRTCIceCandidate;

      // Get UserMedia (only difference is the prefix).
      // Code from Adam Barth.
      getUserMedia = navigator.mozGetUserMedia.bind(navigator);

      // Creates iceServer from the url for FF.
      createIceServer = function(url, username, password) {
        var iceServer = null;
        var url_parts = url.split(':');
        if (url_parts[0].indexOf('stun') === 0) {
          // Create iceServer with stun url.
          iceServer = { 'url': url };
        } else if (url_parts[0].indexOf('turn') === 0 &&
                   (url.indexOf('transport=udp') !== -1 ||
                    url.indexOf('?transport') === -1)) {
          // Create iceServer with turn url.
          // Ignore the transport parameter from TURN url.
          var turn_url_parts = url.split("?");
          iceServer = { 'url': turn_url_parts[0],
                        'credential': password,
                        'username': username };
        }
        return iceServer;
      };

      // Attach a media stream to an element.
      attachMediaStream = function(element, stream) {
        console.log("Attaching media stream");
        element.mozSrcObject = stream;
        element.play();
      };

      reattachMediaStream = function(to, from) {
        console.log("Reattaching media stream");
        to.mozSrcObject = from.mozSrcObject;
        to.play();
      };

      // Fake get{Video,Audio}Tracks
      MediaStream.prototype.getVideoTracks = function() {
        return [];
      };

      MediaStream.prototype.getAudioTracks = function() {
        return [];
      };
    } else if (navigator.webkitGetUserMedia) {
      console.log("This appears to be Chrome");

      webrtcDetectedBrowser = "chrome";
      webrtcDetectedVersion =
                 parseInt(navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)[2]);

      // Creates iceServer from the url for Chrome.
      createIceServer = function(url, username, password) {
        var iceServer = null;
        var url_parts = url.split(':');
        if (url_parts[0].indexOf('stun') === 0) {
          // Create iceServer with stun url.
          iceServer = { 'url': url };
        } else if (url_parts[0].indexOf('turn') === 0) {
          if (webrtcDetectedVersion < 28) {
            // For pre-M28 chrome versions use old TURN format.
            var url_turn_parts = url.split("turn:");
            iceServer = { 'url': 'turn:' + username + '@' + url_turn_parts[1],
                          'credential': password };
          } else {
            // For Chrome M28 & above use new TURN format.
            iceServer = { 'url': url,
                          'credential': password,
                          'username': username };
          }
        }
        return iceServer;
      };

      // The RTCPeerConnection object.
      RTCPeerConnection = webkitRTCPeerConnection;

      // Get UserMedia (only difference is the prefix).
      // Code from Adam Barth.
      getUserMedia = navigator.webkitGetUserMedia.bind(navigator);

      // Attach a media stream to an element.
      attachMediaStream = function(element, stream) {
        if (typeof element.srcObject !== 'undefined') {
          element.srcObject = stream;
        } else if (typeof element.mozSrcObject !== 'undefined') {
          element.mozSrcObject = stream;
        } else if (typeof element.src !== 'undefined') {
          element.src = URL.createObjectURL(stream);
        } else {
          console.log('Error attaching stream to element.');
        }
      };

      reattachMediaStream = function(to, from) {
        to.src = from.src;
      };

      // The representation of tracks in a stream is changed in M26.
      // Unify them for earlier Chrome versions in the coexisting period.
      if (!webkitMediaStream.prototype.getVideoTracks) {
        webkitMediaStream.prototype.getVideoTracks = function() {
          return this.videoTracks;
        };
        webkitMediaStream.prototype.getAudioTracks = function() {
          return this.audioTracks;
        };
      }

      // New syntax of getXXXStreams method in M26.
      if (!webkitRTCPeerConnection.prototype.getLocalStreams) {
        webkitRTCPeerConnection.prototype.getLocalStreams = function() {
          return this.localStreams;
        };
        webkitRTCPeerConnection.prototype.getRemoteStreams = function() {
          return this.remoteStreams;
        };
      }
    } else {
      console.log("Browser does not appear to be WebRTC-capable");
    }
    /** End of Adapter.js */

    if(window.RTC === undefined){
      window.RTC = RTC;
    }
}) ( window );