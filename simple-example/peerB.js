const peerConnection = new RTCPeerConnection();

peerConnection.onicecandidate = () =>
  console.log(
    "We have an ICE candidate (SDP): %s",
    JSON.stringify(peerConnection.localDescription)
  );

peerConnection.ondatachannel = (event) => {
  event.channel.onopen = () =>
    console.log("Data channel is open and ready to be used.");

  event.channel.onmessage = (event) =>
    console.log("New data from peer: %s", event.data);
};

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
