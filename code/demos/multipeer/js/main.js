/***
 * Excerpted from "Programming WebRTC",
 * published by The Pragmatic Bookshelf.
 * Copyrights apply to this code. It may not be used to create training material,
 * courses, books, articles, and the like. Contact us if you are in doubt.
 * We make no guarantees that this code is fit for any purpose.
 * Visit http://www.pragmaticprogrammer.com/titles/ksrtc for more book information.
***/
'use strict';

/**
 *  Global Variables: $self and $peer
 */

const $self = {
  rtcConfig: null,
  mediaConstraints: { audio: false, video: true }
};

const $peers = {};


/**
 *  Signaling-Channel Setup
 */

const namespace = prepareNamespace(window.location.hash, true);

const sc = io.connect('/' + namespace, { autoConnect: false });

registerScCallbacks();



/**
 * =========================================================================
 *  Begin Application-Specific Code
 * =========================================================================
 */



/**
 *  User-Interface Setup
 */

document.querySelector('#header h1')
  .innerText = 'Welcome to Room #' + namespace;

document.querySelector('#call-button')
  .addEventListener('click', handleCallButton);



/**
 *  User Features and Media Setup
 */

requestUserMedia($self.mediaConstraints);



/**
 *  User-Interface Functions and Callbacks
 */

function handleCallButton(event) {
  const callButton = event.target;
  if (callButton.className === 'join') {
    console.log('Joining the call...');
    callButton.className = 'leave';
    callButton.innerText = 'Leave Call';
    joinCall();
  } else {
    console.log('Leaving the call...');
    callButton.className = 'join';
    callButton.innerText = 'Join Call';
    leaveCall();
  }
}

function joinCall() {
  sc.open();
}

function leaveCall() {
  sc.close();
  for (let id in $peers) {
    resetCall(id, true);
  }
}

/**
 *  User-Media and Data-Channel Functions
 */

async function requestUserMedia(media_constraints) {
  $self.stream = new MediaStream();
  $self.media = await navigator.mediaDevices
    .getUserMedia(media_constraints);
  $self.stream.addTrack($self.media.getTracks()[0]);
  displayStream('#self', $self.stream);
}

function createVideoElement(id) {
  const figure = document.createElement('figure');
  const figcaption = document.createElement('figcaption');
  const video = document.createElement('video');
  const attributes = {
    autoplay: '',
    playsinline: '',
    poster: 'img/placeholder.png'
  };
  for (let attr in attributes) {
    video.setAttribute(attr, attributes[attr]);
  }
  figure.id = id;
  figcaption.innerText = id.replace(/^peer-/, ''); // remove `peer-` portion
  figure.appendChild(video);
  figure.appendChild(figcaption);
  return figure;
}

function displayStream(selector, stream) {
  let videoElement = document.querySelector(selector);
  let video;
  if (!videoElement) {
    const id = selector.substring(1);
    const videos = document.querySelector('#videos');
    videoElement = createVideoElement(id);
    videos.appendChild(videoElement);
  }
  video = videoElement.querySelector('video');
  video.srcObject = stream;
}

function addStreamingMedia(id, stream) {
  const peer = $peers[id];
  if (stream) {
    for (let track of stream.getTracks()) {
      peer.connection.addTrack(track, stream);
    }
  }
}


/**
 *  Call Features & Reset Functions
 */

function establishCallFeatures(id) {
  registerRtcCallbacks(id);
  addStreamingMedia(id, $self.stream);
}

function resetCall(id, disconnect) {
  const peer = $peers[id];
  const videoElement = `#peer-${id}`;
  peer.connection.close();
  displayStream(videoElement, null);
  if (disconnect) {
    document.querySelector(videoElement).remove();
    delete $peers[id];
    delete $self[id];
  }
}



/**
 *  WebRTC Functions and Callbacks
 */

function registerRtcCallbacks(id) {
  const peer = $peers[id];
  peer.connection
    .onconnectionstatechange = handleRtcConnectionStateChange(id);
  peer.connection
    .onnegotiationneeded = handleRtcConnectionNegotiation(id);
  peer.connection
    .onicecandidate = handleRtcIceCandidate(id);
  peer.connection
    .ontrack = handleRtcPeerTrack(id);
}

function handleRtcPeerTrack(id) {
  return function({ track, streams: [stream] }) {
    console.log(`Attempt to display media from peer ID: ${id}`);
    displayStream(`#peer-${id}`, stream);
  };
}



/**
 * =========================================================================
 *  End Application-Specific Code
 * =========================================================================
 */


/**
 *  Reusable WebRTC Functions and Callbacks
 */
function handleRtcConnectionNegotiation(id) {
  return async function() {
    const peer = $peers[id];
    if ($self[id].isSuppressingInitialOffer) return;
    try {
      $self[id].isMakingOffer = true;
      await peer.connection.setLocalDescription();
    } catch(e) {
      const offer = await peer.connection.createOffer();
      await peer.connection.setLocalDescription(offer);
    } finally {

  // snip, snip...
      sc.emit('signal',
        { to: id, from: $self.id,
          signal: { description: peer.connection.localDescription } });
  // snip, snip...

      $self[id].isMakingOffer = false;
    }
  };
}

function handleRtcIceCandidate(id) {
  return function({ candidate }) {
    sc.emit('signal', { to: id, from: $self.id,
      signal: { candidate } });
  };
}

function handleRtcConnectionStateChange(id) {
  return function() {
    const peer = $peers[id];
    const connectionState = peer.connection.connectionState;
    document.querySelector(`#peer-${id}`).className = connectionState;
    console.log(`Connection state '${connectionState}' for Peer ID: ${id}`);
  };
}



/**
 *  Signaling-Channel Functions and Callbacks
 */

function registerScCallbacks() {
  sc.on('connect', handleScConnect);
  sc.on('connected peers', handleScConnectedPeers);
  sc.on('connected peer', handleScConnectedPeer);
  sc.on('disconnected peer', handleScDisconnectedPeer);
  sc.on('signal', handleScSignal);
}

function handleScConnect() {
  console.log('Successfully connected to the signaling server!');
  $self.id = sc.id;
  console.log(`Self ID: ${$self.id}`);
}

function handleScConnectedPeers(ids) {
  console.log(`Connected peer IDs: ${ids.join(', ')}`);
  for (let id of ids) {
    if (id !== $self.id) {
      // $self is polite with already-connected peers
      initializeSelfAndPeerById(id, true);
      establishCallFeatures(id);
    }
  }
}

function handleScConnectedPeer(id) {
  console.log(`Newly connected peer ID: ${id}`);
  // $self is impolite with each newly connecting peer
  initializeSelfAndPeerById(id, false);
  establishCallFeatures(id);
}

function handleScDisconnectedPeer(id) {
  console.log(`Disconnected peer ID: ${id}`);
  resetCall(id, true);
}

function initializeSelfAndPeerById(id, polite) {
  $peers[id] = {
    connection: new RTCPeerConnection($self.rtcConfig)
  };
  $self[id] = {
    isPolite: polite,
    isMakingOffer: false,
    isIgnoringOffer: false,
    isSettingRemoteAnswerPending: false
  };
}

function resetAndRetryConnection(id) {
  const isPolite = $self[id].isPolite;
  resetCall(id, false);
  initializeSelfAndPeerById(id, isPolite);
  $self[id].isSuppressingInitialOffer = isPolite;

  establishCallFeatures(id);

  if (isPolite) {
    sc.emit('signal', { to: id, from: $self.id,
      signal: { description: { type: '_reset' } } });
  }
}

async function handleScSignal({ from,
  signal: { candidate, description } }) {

  const id = from;
  const peer = $peers[id];

  if (description) {
    // snip, snip...

    // snip, snip...
    if (description.type === '_reset') {
      console.log(`***** Received a signal to reset from peer ID: ${id}`);
      resetAndRetryConnection(id);
      return;
    }
    // snip, snip...

    const readyForOffer =
          !$self[id].isMakingOffer &&
          (peer.connection.signalingState === 'stable'
            || $self[id].isSettingRemoteAnswerPending);

    const offerCollision = description.type === 'offer' && !readyForOffer;

    $self[id].isIgnoringOffer = !$self[id].isPolite && offerCollision;

    if ($self[id].isIgnoringOffer) {
      return;
    }

    $self[id].isSettingRemoteAnswerPending = description.type === 'answer';

// snip, snip..
    try {
      // snip, snip...
      console.log(`Signaling state '${peer.connection.signalingState}' on
        incoming description for peer ID: ${id}`);
      await peer.connection.setRemoteDescription(description);
    } catch(e) {
      console.log(`***** Resetting and signaling same to peer ID: ${id}`);
      resetAndRetryConnection(id);
      return;
    }
// snip, snip...

    $self[id].isSettingRemoteAnswerPending = false;

// snip, snip...
    if (description.type === 'offer') {
      try {
        await peer.connection.setLocalDescription();
      } catch(e) {
        const answer = await peer.connection.createAnswer();
        await peer.connection.setLocalDescription(answer);
      } finally {
        sc.emit('signal', { to: id, from: $self.id, signal:
          { description: peer.connection.localDescription } });
        $self[id].isSuppressingInitialOffer = false;
      }
    }
// snip, snip...
  } else if (candidate) {
// snip, snip...
    // Handle ICE candidates
    try {
      await peer.connection.addIceCandidate(candidate);
    } catch(e) {
      // Log error unless $self[id] is ignoring offers
      // and candidate is not an empty string
      if (!$self[id].isIgnoringOffer && candidate.candidate.length > 1) {
        console.error(`Unable to add ICE candidate for peer ID: ${id}.`, e);
      }
    }
// snip, snip...
  }
}



/**
 *  Utility Functions
 */

function prepareNamespace(hash, set_location) {
  let ns = hash.replace(/^#/, ''); // remove # from the hash
  if (/^[a-z]{4}-[a-z]{4}-[a-z]{4}$/.test(ns)) {
    console.log(`Checked existing namespace '${ns}'`);
    return ns;
  }
  ns = generateRandomAlphaString('-', 4, 4, 4);
  console.log(`Created new namespace '${ns}'`);
  if (set_location) window.location.hash = ns;
  return ns;
}

function generateRandomAlphaString(separator, ...groups) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  let ns = [];
  for (let group of groups) {
    let str = '';
    for (let i = 0; i < group; i++) {
      str += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    ns.push(str);
  }
  return ns.join(separator);
}

function resetObjectKeys(obj) {
  for (let key of Object.keys(obj)) {
    delete obj[key];
  }
}
