// Create peer connection
// https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection
const peerConnection = new RTCPeerConnection();

// Create data channel used to peer-to-peer transfer of arbitrary data
// https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel
const dataChannel = peerConnection.createDataChannel("channel");
// ... and create listener when data is received on the channel
// https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel/onmessage
dataChannel.onmessage = (event) =>
  console.log("New data from peer: %s", event.data);

// Notify us when data channel connection opens
dataChannel.onopen = () => console.log("Data channel is open");

// Print out information when we have an icecandidate to send to peer
peerConnection.onicecandidate = () =>
  console.log(
    "We have an ICE candidate (SDP): %s",
    JSON.stringify(peerConnection.localDescription)
  );

// Create offer
peerConnection
  .createOffer()
  .then((offer) => peerConnection.setLocalDescription(offer))
  .then(() => console.log("Successfully created offer"));

const form = document.getElementById("form");
const sdp = document.getElementById("sdp");
form.onsubmit = (event) => {
  peerConnection
    .setRemoteDescription(JSON.parse(sdp.value))
    .then(() => console.log("Remote description set"));
  event.preventDefault();
};
