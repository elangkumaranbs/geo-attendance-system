import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Webcam from 'react-webcam';
import toast from 'react-hot-toast';
import { attendanceAPI } from '../utils/api';

export default function FaceVerification() {
  const router = useRouter();
  const webcamRef = useRef(null);
  const [user, setUser] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [particles, setParticles] = useState([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [ripples, setRipples] = useState([]);
  const [glowIntensity, setGlowIntensity] = useState(0);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(storedUser));
  }, [router]);

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      capturePhoto();
    }
  }, [countdown]);

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: 'user',
  };

  const handleCameraReady = () => {
    setCameraReady(true);
    // Simulate face detection with scanning animation
    let progress = 0;
    const scanInterval = setInterval(() => {
      progress += 5;
      setScanProgress(progress);
      if (progress >= 100) {
        clearInterval(scanInterval);
        setFaceDetected(true);
        setGlowIntensity(1);
      }
    }, 50);
  };

  const startCountdown = () => {
    if (!cameraReady) {
      toast.error('Camera not ready');
      return;
    }
    // Create ripple effect
    const newRipple = { id: Date.now() };
    setRipples(prev => [...prev, newRipple]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 1000);
    setCountdown(3);
  };

  const capturePhoto = async () => {
    if (!webcamRef.current || capturing) return;

    setCapturing(true);
    setCountdown(null);

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        throw new Error('Failed to capture image');
      }

      // Show verification animation
      setVerifying(true);
      
      // Simulate face verification (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Random result for demo - replace with actual API response
      const isMatch = Math.random() > 0.3; // 70% success rate for demo
      
      setVerificationResult({
        success: isMatch,
        confidence: isMatch ? (85 + Math.random() * 14).toFixed(2) : (40 + Math.random() * 30).toFixed(2),
        timestamp: new Date().toISOString()
      });

      // Create success particles
      if (isMatch) {
        createParticles();
      }

      setTimeout(() => {
        setVerifying(false);
        if (isMatch) {
          toast.success('Face verified successfully!');
          setTimeout(() => {
            router.push('/student/dashboard');
          }, 2000);
        } else {
          toast.error('Face verification failed');
        }
      }, 1500);

    } catch (error) {
      console.error('Capture error:', error);
      toast.error('Failed to capture photo');
      setCapturing(false);
      setVerifying(false);
    }
  };

  const createParticles = () => {
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: 50,
      y: 50,
      angle: (Math.PI * 2 * i) / 30,
      velocity: 2 + Math.random() * 2
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 2000);
  };

  const resetVerification = () => {
    setVerificationResult(null);
    setCapturing(false);
    setVerifying(false);
    setCountdown(null);
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Face Verification - Geo Attendance</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
          <div className="absolute top-40 right-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-40 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 container mx-auto px-4 py-8 min-h-screen flex flex-col">
          {/* Header */}
          <div className="text-center mb-8 animate-fadeIn">
            <button
              onClick={() => router.push('/student/dashboard')}
              className="inline-flex items-center text-gray-600 hover:text-primary-600 mb-4 hover:scale-105 transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </button>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Face Verification
            </h1>
            <p className="text-gray-600 text-lg">Advanced biometric authentication</p>
          </div>

          {/* Camera Section */}
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-4xl">
              <div className="relative">
                {/* Camera Container */}
                <div className="relative bg-gray-900 rounded-3xl overflow-hidden shadow-2xl animate-slideIn">
                  {/* Camera Loading State */}
                  {!cameraReady && (
                    <div className="absolute inset-0 bg-gray-800 flex items-center justify-center z-20">
                      <div className="text-center animate-pulse-slow">
                        <div className="relative w-24 h-24 mx-auto mb-4">
                          <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          <div className="absolute inset-3 border-4 border-purple-500 border-b-transparent rounded-full animate-spin" style={{animationDirection: 'reverse'}}></div>
                        </div>
                        <p className="text-white text-lg">Initializing camera...</p>
                      </div>
                    </div>
                  )}

                  {/* Webcam */}
                  <div className="relative">
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      videoConstraints={videoConstraints}
                      onUserMedia={handleCameraReady}
                      className="w-full h-auto"
                    />

                    {/* Face Detection Overlay */}
                    {cameraReady && faceDetected && !verificationResult && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="relative w-64 h-80 md:w-80 md:h-96">
                          {/* Holographic border effect */}
                          <div className="absolute inset-0 rounded-3xl" style={{
                            background: 'linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.3), transparent)',
                            animation: 'holographic-border 3s linear infinite'
                          }}></div>
                          
                          {/* Corner brackets with glow */}
                          <div className="absolute top-0 left-0 w-20 h-20 border-t-4 border-l-4 border-green-400 rounded-tl-3xl animate-pulse shadow-glow-green"></div>
                          <div className="absolute top-0 right-0 w-20 h-20 border-t-4 border-r-4 border-green-400 rounded-tr-3xl animate-pulse shadow-glow-green" style={{animationDelay: '0.2s'}}></div>
                          <div className="absolute bottom-0 left-0 w-20 h-20 border-b-4 border-l-4 border-green-400 rounded-bl-3xl animate-pulse shadow-glow-green" style={{animationDelay: '0.4s'}}></div>
                          <div className="absolute bottom-0 right-0 w-20 h-20 border-b-4 border-r-4 border-green-400 rounded-br-3xl animate-pulse shadow-glow-green" style={{animationDelay: '0.6s'}}></div>
                          
                          {/* Scanning lines - multiple layers */}
                          <div className="absolute inset-0 overflow-hidden rounded-3xl">
                            <div className="w-full h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-scan shadow-glow-green"></div>
                            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-scan-slow" style={{animationDelay: '0.5s'}}></div>
                            <div className="w-1 h-full bg-gradient-to-b from-transparent via-green-300 to-transparent animate-scan-horizontal"></div>
                          </div>
                          
                          {/* Circular radar effect */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-48 h-48 rounded-full border-2 border-green-400/30 animate-radar-pulse"></div>
                            <div className="absolute w-40 h-40 rounded-full border-2 border-green-400/40 animate-radar-pulse" style={{animationDelay: '0.3s'}}></div>
                            <div className="absolute w-32 h-32 rounded-full border-2 border-green-400/50 animate-radar-pulse" style={{animationDelay: '0.6s'}}></div>
                          </div>
                          
                          {/* Data points - simulating feature detection */}
                          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                          <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-green-400 rounded-full animate-ping" style={{animationDelay: '0.2s'}}></div>
                          <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-green-400 rounded-full animate-ping" style={{animationDelay: '0.4s'}}></div>
                          <div className="absolute bottom-1/4 right-1/3 w-2 h-2 bg-green-400 rounded-full animate-ping" style={{animationDelay: '0.6s'}}></div>
                          
                          {/* Scan progress indicator */}
                          <div className="absolute -bottom-16 left-0 right-0 px-4">
                            <div className="bg-gray-800/80 backdrop-blur-sm rounded-full p-2 shadow-lg">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-green-400 font-medium">Analyzing biometrics</span>
                                <span className="text-xs text-green-400 font-bold">{scanProgress}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 rounded-full transition-all duration-300 shadow-glow-green"
                                  style={{width: `${scanProgress}%`}}
                                ></div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Face detected indicator */}
                          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-2xl animate-bounce-slow">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
                              ✓ Face Detected
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Countdown Overlay */}
                    {countdown !== null && countdown > 0 && (
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-purple-900/90 to-pink-900/90 backdrop-blur-md flex items-center justify-center">
                        <div className="text-center relative">
                          {/* Expanding rings */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-64 h-64 border-4 border-white/20 rounded-full animate-expand-fade"></div>
                            <div className="absolute w-48 h-48 border-4 border-white/30 rounded-full animate-expand-fade" style={{animationDelay: '0.2s'}}></div>
                            <div className="absolute w-32 h-32 border-4 border-white/40 rounded-full animate-expand-fade" style={{animationDelay: '0.4s'}}></div>
                          </div>
                          
                          <div className="relative z-10">
                            <div className="text-9xl font-black mb-4 animate-count-pulse" style={{
                              background: 'linear-gradient(135deg, #fff, #60a5fa, #a78bfa)',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              filter: 'drop-shadow(0 0 30px rgba(96, 165, 250, 0.8))'
                            }}>
                              {countdown}
                            </div>
                            <p className="text-white text-2xl font-semibold animate-pulse-slow">Get ready...</p>
                            <div className="mt-4 flex justify-center gap-2">
                              <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Verification Processing */}
                    {verifying && (
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/95 to-purple-600/95 flex items-center justify-center backdrop-blur-md">
                        <div className="text-center relative">
                          {/* DNA helix-like rotating structure */}
                          <div className="relative w-40 h-40 mx-auto mb-8">
                            {/* Orbital rings */}
                            <div className="absolute inset-0 border-8 border-white/30 border-t-white rounded-full animate-spin shadow-glow-white"></div>
                            <div className="absolute inset-3 border-8 border-blue-200/40 border-r-blue-200 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.2s'}}></div>
                            <div className="absolute inset-6 border-8 border-purple-200/50 border-b-purple-200 rounded-full animate-spin" style={{animationDuration: '0.8s'}}></div>
                            <div className="absolute inset-9 border-6 border-pink-200/60 border-l-pink-200 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
                            
                            {/* Pulsing core */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-16 h-16 bg-white/20 rounded-full animate-pulse-slow"></div>
                              <div className="absolute w-12 h-12 bg-white/30 rounded-full animate-pulse-slow" style={{animationDelay: '0.3s'}}></div>
                              <div className="absolute w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-2xl">
                                <svg className="w-5 h-5 text-blue-600 animate-pulse-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              </div>
                            </div>
                            
                            {/* Orbiting particles */}
                            <div className="absolute inset-0 animate-spin" style={{animationDuration: '3s'}}>
                              <div className="absolute top-0 left-1/2 w-3 h-3 bg-white rounded-full shadow-glow-white"></div>
                            </div>
                            <div className="absolute inset-0 animate-spin" style={{animationDuration: '2s', animationDirection: 'reverse'}}>
                              <div className="absolute bottom-0 left-1/2 w-3 h-3 bg-yellow-300 rounded-full shadow-glow-yellow"></div>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <h3 className="text-3xl font-bold text-white mb-2 animate-pulse-slow">Verifying Identity</h3>
                            <div className="flex items-center justify-center gap-2 text-blue-100">
                              <div className="w-2 h-2 bg-blue-200 rounded-full animate-bounce"></div>
                              <p className="text-lg">Analyzing facial features</p>
                            </div>
                            <div className="flex items-center justify-center gap-2 text-purple-100">
                              <div className="w-2 h-2 bg-purple-200 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                              <p className="text-lg">Matching biometric data</p>
                            </div>
                            <div className="flex items-center justify-center gap-2 text-pink-100">
                              <div className="w-2 h-2 bg-pink-200 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                              <p className="text-lg">Confirming identity</p>
                            </div>
                          </div>
                          
                          {/* Progress dots */}
                          <div className="flex justify-center gap-3 mt-6">
                            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                            <div className="w-3 h-3 bg-white rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                            <div className="w-3 h-3 bg-white rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                            <div className="w-3 h-3 bg-white rounded-full animate-pulse" style={{animationDelay: '0.6s'}}></div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Success Result */}
                    {verificationResult?.success && (
                      <div className="absolute inset-0 bg-gradient-to-br from-green-500/95 to-emerald-500/95 flex items-center justify-center backdrop-blur-sm animate-fadeIn">
                        <div className="text-center relative">
                          {/* Success particles */}
                          {particles.map(particle => (
                            <div
                              key={particle.id}
                              className="absolute w-3 h-3 bg-white rounded-full animate-particle"
                              style={{
                                left: '50%',
                                top: '50%',
                                transform: `translate(-50%, -50%) translate(${Math.cos(particle.angle) * particle.velocity * 100}px, ${Math.sin(particle.angle) * particle.velocity * 100}px)`,
                                animationDelay: `${particle.id * 20}ms`
                              }}
                            />
                          ))}
                          
                          <div className="relative z-10">
                            <div className="w-32 h-32 bg-white rounded-full mx-auto mb-6 flex items-center justify-center animate-scale-in shadow-2xl">
                              <svg className="w-20 h-20 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <h2 className="text-4xl font-bold text-white mb-3">Verification Successful!</h2>
                            <p className="text-green-100 text-xl mb-4">Identity confirmed</p>
                            <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-3 inline-block">
                              <p className="text-white text-lg">Confidence: <span className="font-bold">{verificationResult.confidence}%</span></p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Failure Result */}
                    {verificationResult && !verificationResult.success && (
                      <div className="absolute inset-0 bg-gradient-to-br from-red-500/95 to-pink-500/95 flex items-center justify-center backdrop-blur-sm animate-fadeIn">
                        <div className="text-center">
                          <div className="w-32 h-32 bg-white rounded-full mx-auto mb-6 flex items-center justify-center animate-shake shadow-2xl">
                            <svg className="w-20 h-20 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                          <h2 className="text-4xl font-bold text-white mb-3">Verification Failed</h2>
                          <p className="text-red-100 text-xl mb-4">Face not recognized</p>
                          <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-3 inline-block mb-6">
                            <p className="text-white text-lg">Confidence: <span className="font-bold">{verificationResult.confidence}%</span></p>
                          </div>
                          <button
                            onClick={resetVerification}
                            className="bg-white text-red-600 px-6 py-3 rounded-full font-semibold hover:scale-105 active:scale-95 shadow-lg transition-all duration-200"
                          >
                            Try Again
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Control Panel */}
                  {cameraReady && !verificationResult && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                      <div className="flex justify-center items-center gap-4">
                        {!capturing && !verifying && (
                          <>
                            <button
                              onClick={startCountdown}
                              disabled={countdown !== null}
                              className="group relative w-24 h-24 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl transition-all duration-200"
                            >
                              {/* Animated ripples */}
                              {ripples.map(ripple => (
                                <div
                                  key={ripple.id}
                                  className="absolute inset-0 rounded-full border-4 border-white animate-ripple"
                                ></div>
                              ))}
                              
                              {/* Pulsing glow */}
                              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 animate-ping opacity-20"></div>
                              <div className="absolute inset-0 rounded-full bg-white opacity-10 animate-pulse-slow"></div>
                              
                              {/* Camera icon */}
                              <svg className="w-12 h-12 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              
                              {/* Rotating ring */}
                              <div className="absolute inset-0 border-4 border-transparent border-t-white/50 rounded-full animate-spin" style={{animationDuration: '3s'}}></div>
                            </button>
                            <div className="text-center ml-4">
                              <p className="text-white text-base font-semibold">Capture Face</p>
                              <p className="text-gray-300 text-sm">Click to start verification</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Status Information */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 animate-slideIn delay-150">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Camera Status</p>
                        <p className="font-semibold text-gray-900">{cameraReady ? 'Active' : 'Loading...'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 animate-slideIn delay-300">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Face Detection</p>
                        <p className="font-semibold text-gray-900">{faceDetected ? 'Detected' : 'Searching...'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 animate-slideIn delay-500">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Security</p>
                        <p className="font-semibold text-gray-900">Encrypted</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        
        @keyframes scan {
          0% { transform: translateY(-100%); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(400%); opacity: 0; }
        }
        
        @keyframes scan-slow {
          0% { transform: translateY(-100%); opacity: 0; }
          50% { opacity: 0.6; }
          100% { transform: translateY(400%); opacity: 0; }
        }
        
        @keyframes scan-horizontal {
          0% { transform: translateX(-100%); opacity: 0; }
          50% { opacity: 0.8; }
          100% { transform: translateX(400%); opacity: 0; }
        }
        
        @keyframes holographic-border {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes radar-pulse {
          0% { transform: scale(0.8); opacity: 0; }
          50% { opacity: 0.5; }
          100% { transform: scale(1.5); opacity: 0; }
        }

        @keyframes ping-once {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes count-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        
        @keyframes expand-fade {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(2); opacity: 0; }
        }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes scale-in {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-10px) rotate(-2deg); }
          20%, 40%, 60%, 80% { transform: translateX(10px) rotate(2deg); }
        }

        @keyframes particle {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0);
          }
        }
        
        @keyframes ripple {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animate-scan {
          animation: scan 2s linear infinite;
        }
        
        .animate-scan-slow {
          animation: scan-slow 3s linear infinite;
        }
        
        .animate-scan-horizontal {
          animation: scan-horizontal 2.5s linear infinite;
        }
        
        .animate-radar-pulse {
          animation: radar-pulse 2s ease-out infinite;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animate-ping-once {
          animation: ping-once 1s ease-in-out;
        }
        
        .animate-count-pulse {
          animation: count-pulse 1s ease-in-out infinite;
        }
        
        .animate-expand-fade {
          animation: expand-fade 1.5s ease-out infinite;
        }

        .animate-scale-in {
          animation: scale-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .animate-shake {
          animation: shake 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97);
        }

        .animate-particle {
          animation: particle 1.5s ease-out forwards;
        }
        
        .animate-ripple {
          animation: ripple 1s ease-out forwards;
        }
        
        .shadow-glow-green {
          box-shadow: 0 0 20px rgba(34, 197, 94, 0.6), 0 0 40px rgba(34, 197, 94, 0.3);
        }
        
        .shadow-glow-white {
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.6), 0 0 40px rgba(255, 255, 255, 0.3);
        }
        
        .shadow-glow-yellow {
          box-shadow: 0 0 20px rgba(253, 224, 71, 0.8), 0 0 40px rgba(253, 224, 71, 0.4);
        }

        .delay-150 {
          animation-delay: 150ms;
        }

        .delay-300 {
          animation-delay: 300ms;
        }

        .delay-500 {
          animation-delay: 500ms;
        }
      `}</style>
    </>
  );
}
