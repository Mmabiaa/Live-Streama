// src/App.js
import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import VideoComponent from './components/VideoComponent';

const socket = io('http://localhost:4000');

function App() {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const peerConnection = useRef(new RTCPeerConnection());

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        setLocalStream(stream);
        stream.getTracks().forEach(track => peerConnection.current.addTrack(track, stream));
      });

    peerConnection.current.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    socket.on('offer', (offer) => {
      peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
      peerConnection.current.createAnswer()
        .then(answer => {
          peerConnection.current.setLocalDescription(answer);
          socket.emit('answer', answer);
        });
    });

    socket.on('answer', (answer) => {
      peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const createOffer = () => {
    peerConnection.current.createOffer()
      .then(offer => {
        peerConnection.current.setLocalDescription(offer);
        socket.emit('offer', offer);
      });
  };

  return (
    <div>
      <h1>Streama</h1>
      <button onClick={createOffer}>Start Call</button>
      <div>
        <h2>Your Video</h2>
        {localStream && <VideoComponent stream={localStream} />}
        <h2>Remote Video</h2>
        {remoteStream && <VideoComponent stream={remoteStream} />}
      </div>
    </div>
  );
}

export default App;