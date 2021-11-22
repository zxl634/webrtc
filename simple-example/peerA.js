// 1. Create connection and data channel

// Create peer connection
// https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection
const peerConnection = new RTCPeerConnection();

// Add listener on peer connection to print out SDP
// https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/onicecandidate
peerConnection.onicecandidate = () =>
  console.log(
    "We have an ICE candidate (SDP): %s",
    JSON.stringify(peerConnection.localDescription)
  );

// Create data channel used to peer-to-peer transfer of arbitrary data
// https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel
const dataChannel = peerConnection.createDataChannel("channel");

// Create listener when data is received on the channel
// https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel/onmessage
dataChannel.onmessage = (event) =>
  console.log("New data from peer: %s", event.data);

// Notify us when data channel connection opens
dataChannel.onopen = () => console.log("Data channel is open");

// 2. Create offer and set local description
// https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createOffer
peerConnection
  .createOffer()
  // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/setLocalDescription
  .then((offer) => peerConnection.setLocalDescription(offer))
  .then(() => console.log("Successfully created offer"));

// Set remote description when answer is received
const form = document.getElementById("form");
const sdp = document.getElementById("sdp");
form.onsubmit = (event) => {
  peerConnection
    .setRemoteDescription(JSON.parse(sdp.value))
    .then(() => console.log("Remote description set"));
  event.preventDefault();
};
