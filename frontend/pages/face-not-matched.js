import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function FaceNotMatched() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Auto logout after 5 seconds
    const logoutTimer = setTimeout(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    }, 5000);

    return () => {
      clearInterval(countdownInterval);
      clearTimeout(logoutTimer);
    };
  }, [router]);

  return (
    <>
      <Head>
        <title>Face Not Matched - Geo Attendance</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-100 flex items-center justify-center p-3 sm:p-4 md:p-6">
        <div className="max-w-md w-full mx-auto animate-fadeIn">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 text-center hover:shadow-3xl transition-shadow duration-300">
            {/* Error Icon */}
            <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-red-100 rounded-full flex items-center justify-center mb-4 sm:mb-5 md:mb-6 animate-pulse-slow shadow-lg">
              <svg
                className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
              Face Not Matched!
            </h1>

            {/* Message */}
            <p className="text-base sm:text-lg text-gray-700 mb-4 sm:mb-5 md:mb-6 px-2">
              Your face could not be verified for attendance marking.
            </p>

            {/* Warning Box */}
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-5 md:mb-6 animate-slideIn hover:border-red-300 transition-colors duration-200">
              <p className="text-red-800 font-semibold text-sm sm:text-base">
                ⚠️ Security Alert
              </p>
              <p className="text-red-700 text-xs sm:text-sm mt-2 leading-relaxed">
                Multiple failed attempts may result in account suspension.
                Please contact your administrator if you believe this is an error.
              </p>
            </div>

            {/* Countdown */}
            <div className="bg-gray-100 rounded-lg p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6">
              <p className="text-gray-600 mb-2 text-sm sm:text-base">Logging out in</p>
              <div className="text-5xl sm:text-6xl md:text-7xl font-bold text-red-600 mb-2">
                {countdown}
              </div>
              <p className="text-gray-500 text-xs sm:text-sm">seconds</p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2 mb-4 sm:mb-5 md:mb-6">
              <div
                className="bg-red-600 h-1.5 sm:h-2 rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${(5 - countdown) * 20}%` }}
              ></div>
            </div>

            {/* Manual Logout Button */}
            <button
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                router.push('/login');
              }}
              className="w-full bg-red-600 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg text-sm sm:text-base font-semibold hover:bg-red-700 hover:scale-105 active:scale-95 active:bg-red-800 shadow-md hover:shadow-lg transition-all duration-200 touch-manipulation"
            >
              Logout Now
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
