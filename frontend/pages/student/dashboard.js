import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import WebcamCapture from '../../components/WebcamCapture';
import GeolocationTracker from '../../components/GeolocationTracker';
import { attendanceAPI, geofenceAPI } from '../../utils/api';

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [location, setLocation] = useState(null);
  const [faceImage, setFaceImage] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [geofenceStatus, setGeofenceStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: location, 2: face, 3: confirm
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    // Don't check auth if we're in the process of logging out
    if (isLoggingOut) {
      console.log('⏸️ Skipping auth check - logout in progress');
      return;
    }
    
    // Check authentication
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    
    const parsedUser = JSON.parse(storedUser);
    
    // Redirect admin to admin dashboard
    if (parsedUser.role === 'admin') {
      toast.info('Redirecting to admin dashboard...');
      router.push('/admin/dashboard');
      return;
    }
    
    setUser(parsedUser);

    // Check today's attendance
    checkTodayAttendance();
  }, [router, isLoggingOut]);

  const checkTodayAttendance = async () => {
    try {
      const response = await attendanceAPI.getTodayAttendance();
      if (response.data.success && response.data.data.marked) {
        setTodayAttendance(response.data.data.attendance);
      }
    } catch (error) {
      console.error('Error checking attendance:', error);
    }
  };

  const handleLocationUpdate = async (coords) => {
    setLocation(coords);

    // Validate location against geofences
    try {
      const response = await geofenceAPI.validateLocation({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      if (response.data.success) {
        setGeofenceStatus(response.data.data);
      }
    } catch (error) {
      console.error('Geofence validation error:', error);
    }
  };

  const handleFaceCapture = async (imageSrc) => {
    console.log('✅ Face captured! Image size:', imageSrc?.length, 'bytes');
    setFaceImage(imageSrc);
    toast.success('Face captured! Verifying...');
    
    // Immediately proceed to mark attendance
    await submitAttendance(imageSrc);
  };

  const submitAttendance = async (capturedFace) => {
    if (!location) {
      toast.error('Location not available');
      return;
    }

    if (!capturedFace) {
      toast.error('Please capture your face');
      return;
    }

    if (geofenceStatus && !geofenceStatus.valid) {
      toast.error('You are not within a valid geofence area');
      return;
    }

    setLoading(true);

    try {
      console.log('📤 Submitting attendance...');
      const response = await attendanceAPI.markAttendance({
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
        },
        faceImage: capturedFace,
        deviceInfo: {
          user_agent: navigator.userAgent,
          device_type: 'web',
        },
      });

      if (response.data.success) {
        setLoading(false);
        toast.success('✅ ' + response.data.message);
        setTodayAttendance(response.data.data.attendance);
        setStep(1);
        setFaceImage(null);
      }
    } catch (error) {
      setLoading(false); // Stop loading immediately
      
      console.error('❌ Attendance error:', error);
      console.log('📋 Error name:', error.name);
      console.log('📋 Error message:', error.message);
      console.log('📋 Error code:', error.code);
      console.log('🔍 Error response:', error.response);
      console.log('🔍 Error status:', error.response?.status);
      console.log('🔍 Error data:', error.response?.data);
      console.log('🔍 Request config:', error.config?.url);
      
      const errorMsg = error.response?.data?.message || error.message || 'Failed to mark attendance';
      const errorStatus = error.response?.status;
      const errorDetails = error.response?.data?.data || {};
      
      console.log('💬 Final error message:', errorMsg);
      console.log('📊 Error details:', errorDetails);
      
      // Handle different error types
      if (errorStatus === 401) {
        // Face verification failed
        console.log('🚫 Face verification failed (401) - redirecting to warning page');
        
        if (isLoggingOut) {
          console.log('⚠️ Already logging out, ignoring duplicate');
          return;
        }
        
        setIsLoggingOut(true);
        router.push('/face-not-matched');
        return;
      } else if (errorStatus === 400) {
        // Bad request - could be geofence, already marked, or validation error
        console.log('⚠️ Bad request (400):', errorMsg);
        toast.error(errorMsg);
        
        // If already marked today, refresh the page to show the status
        if (errorMsg.toLowerCase().includes('already marked')) {
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          // Reset to location step for other 400 errors
          setStep(1);
          setFaceImage(null);
        }
      } else if (errorStatus === 503) {
        // Service unavailable
        console.log('🔧 Service unavailable (503)');
        toast.error('Face verification service is temporarily unavailable. Please try again in a moment.');
        setStep(2);
        setFaceImage(null);
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        // Timeout error
        console.log('⏱️ Request timeout');
        toast.error('Request timed out. Please check your connection and try again.');
        setStep(2);
        setFaceImage(null);
      } else if (!error.response) {
        // Network error
        console.log('🌐 Network error - no response from server');
        toast.error('Network error. Please check your internet connection.');
        setStep(2);
        setFaceImage(null);
      } else {
        // Other errors
        console.log('❌ Unknown error - allowing retry');
        
        // Show detailed error in development
        const isDev = process.env.NODE_ENV === 'development';
        if (isDev && errorDetails) {
          toast.error(
            `${errorMsg}\n${errorDetails.similarity ? `Similarity: ${(errorDetails.similarity * 100).toFixed(1)}%` : ''}${errorDetails.distance ? `\nDistance: ${errorDetails.distance}m` : ''}`,
            { duration: 6000 }
          );
        } else {
          toast.error(errorMsg);
        }
        
        setStep(2);
        setFaceImage(null);
      }
    }
  };



  if (!user) {
    return <Layout><div>Loading...</div></Layout>;
  }

  return (
    <Layout>
      <Head>
        <title>Dashboard - Geo Attendance</title>
      </Head>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8 animate-fadeIn">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent mb-2">
            Welcome, {user.name}!
          </h1>
          <p className="text-sm sm:text-base text-gray-600">Mark your attendance with face verification and location</p>
        </div>

        {/* Today's Attendance Status */}
        {todayAttendance ? (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 animate-slideIn hover:shadow-lg transition-shadow duration-300">
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-6 h-6 sm:w-8 sm:h-8 text-white"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-lg sm:text-xl font-semibold text-green-800 mb-1">
                  ✅ Attendance Already Marked for Today
                </h3>
                <p className="text-sm sm:text-base text-green-700">
                  Check-in: {new Date(todayAttendance.check_in_time).toLocaleTimeString()} |{' '}
                  Status: <span className="font-semibold capitalize">{todayAttendance.status}</span> |{' '}
                  Location: {todayAttendance.geofence_name}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Progress Steps */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center justify-center gap-2 sm:gap-4">
                <div className={`flex items-center gap-1 sm:gap-2 ${step >= 1 ? 'text-primary-600' : 'text-gray-400'} transition-all duration-300`}>
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base ${step >= 1 ? 'bg-primary-600 text-white shadow-lg' : 'bg-gray-200'} transition-all duration-300 ${step === 1 ? 'animate-pulse-slow' : ''}`}>
                    1
                  </div>
                  <span className="font-medium text-xs sm:text-sm md:text-base hidden sm:inline">Location</span>
                </div>
                <div className={`w-8 sm:w-16 h-1 transition-all duration-300 ${step >= 2 ? 'bg-primary-600' : 'bg-gray-300'}`}></div>
                <div className={`flex items-center gap-1 sm:gap-2 ${step >= 2 ? 'text-primary-600' : 'text-gray-400'} transition-all duration-300`}>
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base ${step >= 2 ? 'bg-primary-600 text-white shadow-lg' : 'bg-gray-200'} transition-all duration-300 ${step === 2 ? 'animate-pulse-slow' : ''}`}>
                    2
                  </div>
                  <span className="font-medium text-xs sm:text-sm md:text-base hidden sm:inline">Face Capture</span>
                </div>
                <div className={`w-8 sm:w-16 h-1 transition-all duration-300 ${step >= 3 ? 'bg-primary-600' : 'bg-gray-300'}`}></div>
                <div className={`flex items-center gap-1 sm:gap-2 ${step >= 3 ? 'text-primary-600' : 'text-gray-400'} transition-all duration-300`}>
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base ${step >= 3 ? 'bg-primary-600 text-white shadow-lg' : 'bg-gray-200'} transition-all duration-300 ${step === 3 ? 'animate-pulse-slow' : ''}`}>
                    3
                  </div>
                  <span className="font-medium text-xs sm:text-sm md:text-base hidden sm:inline">Confirm</span>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              {/* Left Column - Location */}
              <div className="animate-slideIn">
                <div className="card hover:shadow-2xl transition-all duration-300">
                  <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Step 1: Verify Location</h3>
                  <GeolocationTracker
                    onLocationUpdate={handleLocationUpdate}
                    onError={(error) => toast.error(error)}
                  />

                  {geofenceStatus && (
                    <div className={`mt-4 p-4 rounded-lg ${geofenceStatus.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      <p className={`font-medium ${geofenceStatus.valid ? 'text-green-800' : 'text-red-800'}`}>
                        {geofenceStatus.valid ? '✅ Inside Valid Geofence' : '❌ Outside Geofence Area'}
                      </p>
                      {geofenceStatus.validGeofence && (
                        <p className="text-sm text-gray-700 mt-1">
                          Location: {geofenceStatus.validGeofence.name}
                        </p>
                      )}
                      {!geofenceStatus.valid && geofenceStatus.nearestGeofence && (
                        <p className="text-sm text-red-700 mt-1">
                          Distance: {geofenceStatus.distance?.toFixed(0)}m from {geofenceStatus.nearestGeofence}
                        </p>
                      )}
                    </div>
                  )}

                  {location && geofenceStatus?.valid && (
                    <button
                      onClick={() => {
                        console.log('Moving to step 2');
                        setStep(2);
                      }}
                      className="w-full mt-4 btn-primary"
                    >
                      ✅ Next: Capture Face
                    </button>
                  )}
                  
                  {location && !geofenceStatus?.valid && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        📍 Please move to the designated area to continue
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Face Capture */}
              <div className="animate-fadeIn">
                {step >= 2 ? (
                  <div className="card hover:shadow-2xl transition-all duration-300">
                    <h3 className="text-xl font-semibold mb-4">Step 2: Face Verification</h3>
                    
                    {loading ? (
                      <div className="text-center py-12 animate-fadeIn">
                        <div className="relative mx-auto mb-6 w-24 h-24">
                          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-600 border-r-blue-400"></div>
                          <div className="absolute inset-2 animate-spin rounded-full border-4 border-transparent border-b-blue-600 border-l-blue-400" style={{animationDirection: 'reverse', animationDuration: '1s'}}></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="w-10 h-10 text-blue-600 animate-pulse-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                        <p className="text-lg font-medium text-gray-700 animate-pulse-slow">Verifying your face...</p>
                        <p className="text-sm text-gray-500 mt-2">Using CNN-based recognition</p>
                      </div>
                    ) : (
                      <>
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>📷 Ready to capture:</strong> Position your face in the center and click the button below
                          </p>
                        </div>
                        <WebcamCapture
                          onCapture={handleFaceCapture}
                          onError={(error) => toast.error(error)}
                        />
                      </>
                    )}
                  </div>
                ) : (
                  <div className="card bg-gray-50">
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-500 mb-2">Face Verification</h3>
                      <p className="text-sm text-gray-400">Complete location verification first</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
