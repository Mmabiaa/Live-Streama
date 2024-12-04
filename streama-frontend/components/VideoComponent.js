// src/components/VideoComponent.js
import React, { useEffect, useRef } from 'react';

const VideoComponent = ({ stream }) => {
  const videoRef = useRef();

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return <video ref={videoRef} autoPlay playsInline />;
};

export default VideoComponent;