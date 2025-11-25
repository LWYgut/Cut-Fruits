import React, { useRef, useEffect, useState } from 'react';

// Type definitions for MediaPipe globals added via CDN
declare global {
  interface Window {
    Hands: any;
    Camera: any;
  }
}

interface MotionEngineProps {
  onMove: (x: number, y: number) => void;
  onHandDetected: (detected: boolean) => void;
  isActive: boolean;
}

const MotionEngine: React.FC<MotionEngineProps> = ({ onMove, onHandDetected, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const requestRef = useRef<number>(0);
  const handsRef = useRef<any>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);

  // Initialize MediaPipe Hands
  useEffect(() => {
    const initHands = async () => {
      if (!window.Hands) {
        console.error("MediaPipe Hands not loaded");
        return;
      }

      const hands = new window.Hands({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.4, // Lowered slightly for better responsiveness
        minTrackingConfidence: 0.4
      });

      hands.onResults((results: any) => {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          onHandDetected(true);
          const landmarks = results.multiHandLandmarks[0];
          // Landmark 8 is the Index Finger Tip
          const indexFinger = landmarks[8];
          
          if (indexFinger) {
            // Mirror the X coordinate for natural interaction
            const x = 1.0 - indexFinger.x;
            const y = indexFinger.y;
            onMove(x, y);
          }
        } else {
          onHandDetected(false);
        }
      });

      await hands.initialize();
      handsRef.current = hands;
      setIsModelLoaded(true);
    };

    initHands();

    return () => {
      if (handsRef.current) {
        handsRef.current.close();
      }
    };
  }, []); // Run once on mount

  // Camera handling and Frame Loop
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              width: { ideal: 640 }, 
              height: { ideal: 480 }, 
              facingMode: 'user' 
            } 
        });
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    };

    // Always keep camera on if the component is mounted to allow detection in Menu
    if (!videoRef.current?.srcObject) {
       startCamera();
    }

    return () => {
      // Cleanup handled by browser usually
    };
  }, []);

  // Processing Loop
  useEffect(() => {
    const video = videoRef.current;
    
    const sendFrame = async () => {
      if (video && video.readyState === 4 && handsRef.current && isModelLoaded && isActive) {
        try {
          await handsRef.current.send({ image: video });
        } catch (e) {
          console.error("Frame processing error", e);
        }
      }
      requestRef.current = requestAnimationFrame(sendFrame);
    };

    requestRef.current = requestAnimationFrame(sendFrame);

    return () => cancelAnimationFrame(requestRef.current);
  }, [isActive, isModelLoaded]);

  return (
    <div className="hidden">
      <video ref={videoRef} playsInline muted className="scale-x-[-1]" />
    </div>
  );
};

export default MotionEngine;