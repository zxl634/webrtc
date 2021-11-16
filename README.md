# Modified source code to the book "Programming WebRTC"

- https://pragprog.com/titles/ksrtc/programming-webrtc/

## Setup

1. `mkdir certs`
1. `npm run ssl-keys --keydir="../certs/" --numdays=1825`
1. Set LOCALHOST_SSL_CERT and LOCALHOST_SSL_KEY to path of the generated files from the above step, e.g. `export` in startup scripts. Test by `echo $LOCALHOST_SSL_CERT`.
1. `npm install`
1. `npm start`
