import { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';

export default function WebcamCapture({ onCapture, onError, autoReset = false }) {
  const webcamRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    // Reset states when component mounts
    setCameraReady(false);
    setCapturing(false);
  }, []);

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: 'user',
  };

  const handleCameraReady = () => {
    console.log('✅ Camera ready');
    setCameraReady(true);
  };

  const handleCameraError = (error) => {
    console.error('❌ Camera error:', error);
    setCameraReady(false);
    if (onError) {
      onError('Camera access denied. Please allow camera permissions.');
    }
  };

  const capturePhoto = () => {
    if (!webcamRef.current || !cameraReady) {
      console.warn('⚠️ Camera not ready');
      return;
    }

    if (capturing) {
      console.warn('⚠️ Already capturing');
      return;
    }

    setCapturing(true);
    console.log('📸 Capturing photo...');

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      
      if (imageSrc) {
        console.log('✅ Photo captured successfully');
        
        // Call parent callback immediately
        if (onCapture) {
          onCapture(imageSrc);
        }
      } else {
        console.error('❌ Failed to capture image');
        setCapturing(false);
      }
    } catch (error) {
      console.error('❌ Capture error:', error);
      setCapturing(false);
      if (onError) {
        onError('Failed to capture photo. Please try again.');
      }
    }
  };

  return (
    <div className="webcam-capture-container">
      <div className="relative w-full max-w-md mx-auto bg-gray-900 rounded-lg overflow-hidden shadow-2xl animate-fadeIn">
        {!cameraReady && (
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center z-10">
            <div className="text-center animate-pulse-slow">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500 mx-auto mb-3"></div>
              <p className="text-white text-sm">Initializing camera...</p>
            </div>
          </div>
        )}
        
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          onUserMedia={handleCameraReady}
          onUserMediaError={handleCameraError}
          className="w-full h-auto"
        />
        
        {capturing && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center animate-fadeIn">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-lg font-semibold text-gray-800 animate-pulse-slow">Processing...</p>
            </div>
          </div>
        )}
        
        <div className="absolute bottom-4 left-0 right-0 flex justify-center animate-slideIn">
          <button
            onClick={capturePhoto}
            disabled={!cameraReady || capturing}
            className="bg-blue-600 hover:bg-blue-700 hover:scale-110 active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100 text-white px-8 py-3 rounded-full font-medium shadow-lg hover:shadow-2xl transition-all duration-200 flex items-center gap-2"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {!cameraReady ? 'Starting Camera...' : capturing ? 'Processing...' : 'Capture Face'}
          </button>
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <div className="space-y-2 text-sm text-gray-600">
          <p>📷 Position your face in the center</p>
          <p>💡 Ensure good lighting</p>
          <p>👤 Remove glasses if recognition fails</p>
        </div>
      </div>
    </div>
  );
}
