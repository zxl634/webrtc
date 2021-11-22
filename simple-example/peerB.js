// 1. Create connection and data channel for peer B
const peerConnection = new RTCPeerConnection();
let dataChannel;

// Add listener on peer connection to print out SDP (same as peer A)
peerConnection.onicecandidate = () =>
  console.log(
    "We have an ICE candidate (SDP): %s",
    JSON.stringify(peerConnection.localDescription)
  );

// Add listener when remote peer calls `createDataChannel()`
// https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/ondatachannel
peerConnection.ondatachannel = (event) => {
  event.channel.onopen = () =>
    console.log("Data channel is open and ready to be used.");

  event.channel.onmessage = (event) =>
    console.log("New data from peer: %s", event.data);

  dataChannel = event.channel;
};

// 2. Use offer to set remote description and create answer
const form = document.getElementById("form");
const sdp = document.getElementById("sdp");
form.onsubmit = (event) => {
  peerConnection
    .setRemoteDescription(JSON.parse(sdp.value))
    .then(() => console.log("Remote description set"))
    .then(() => peerConnection.createAnswer())
    .then((answer) => peerConnection.setLocalDescription(answer))
    .then(() => console.log("Answer created"));
  event.preventDefault();
};
