import { useState, useEffect } from 'react';
import WebcamCapture from './WebcamCapture';
import { adminAPI } from '../utils/api';
import toast from 'react-hot-toast';

export default function FacePatternTrainer({ user, requiredCount, onProgress }) {
  const [capturedImages, setCapturedImages] = useState([]);
  const [showWebcam, setShowWebcam] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    // Notify parent of progress
    if (onProgress) {
      onProgress(capturedImages.length);
    }
  }, [capturedImages.length, onProgress]);

  const handleCapture = async (imageData) => {
    if (capturedImages.length >= requiredCount) {
      return;
    }

    setIsTraining(true);

    try {
      // Convert base64 to blob
      const base64Data = imageData.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let j = 0; j < byteCharacters.length; j++) {
        byteNumbers[j] = byteCharacters.charCodeAt(j);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('image', blob, `face-pattern-${capturedImages.length + 1}.jpg`);

      // Upload to backend
      const response = await adminAPI.registerFaceForUser(user.userId, formData);

      if (response.data.success) {
        setCapturedImages(prev => [...prev, {
          data: imageData,
          quality: response.data.data.quality_score,
          id: response.data.data.embeddingId
        }]);
        
        toast.success(`Pattern ${capturedImages.length + 1}/${requiredCount} captured! Quality: ${(response.data.data.quality_score * 100).toFixed(0)}%`);
        
        if (capturedImages.length + 1 >= requiredCount) {
          setShowWebcam(false);
          toast.success('All face patterns captured successfully!');
        }
      }
    } catch (error) {
      console.error('Error capturing face pattern:', error);
      const errorMsg = error.response?.data?.message || 'Failed to capture face pattern. Please try again.';
      toast.error(errorMsg);
    } finally {
      setIsTraining(false);
    }
  };

  const startCapture = () => {
    if (!user || !user.userId) {
      toast.error('User information is missing');
      return;
    }
    setShowWebcam(true);
  };

  const removePattern = async (index) => {
    if (!confirm('Remove this face pattern?')) return;
    
    const newImages = capturedImages.filter((_, i) => i !== index);
    setCapturedImages(newImages);
    toast.success('Pattern removed');
  };

  const retakeAll = () => {
    if (!confirm('This will remove all captured patterns. Continue?')) return;
    setCapturedImages([]);
    setShowWebcam(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);

    if (capturedImages.length >= requiredCount) {
      toast.error(`Maximum ${requiredCount} patterns allowed`);
      return;
    }

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      toast.error('Please drop image files only');
      return;
    }

    for (const file of imageFiles) {
      if (capturedImages.length >= requiredCount) {
        toast.error(`Maximum ${requiredCount} patterns reached`);
        break;
      }
      await uploadImageFile(file);
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    
    if (capturedImages.length >= requiredCount) {
      toast.error(`Maximum ${requiredCount} patterns allowed`);
      return;
    }

    for (const file of files) {
      if (capturedImages.length >= requiredCount) {
        toast.error(`Maximum ${requiredCount} patterns reached`);
        break;
      }
      await uploadImageFile(file);
    }

    // Reset input
    e.target.value = '';
  };

  const uploadImageFile = async (file) => {
    if (!user || !user.userId) {
      toast.error('User information is missing');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setIsTraining(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await adminAPI.registerFaceForUser(user.userId, formData);

      if (response.data.success) {
        // Convert uploaded file to base64 for preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setCapturedImages(prev => [...prev, {
            data: e.target.result,
            quality: response.data.data.quality_score,
            id: response.data.data.embeddingId
          }]);
        };
        reader.readAsDataURL(file);
        
        toast.success(`Pattern ${capturedImages.length + 1}/${requiredCount} uploaded! Quality: ${(response.data.data.quality_score * 100).toFixed(0)}%`);
        
        if (capturedImages.length + 1 >= requiredCount) {
          toast.success('All face patterns uploaded successfully!');
        }
      }
    } catch (error) {
      console.error('Error uploading face pattern:', error);
      const errorMsg = error.response?.data?.message || 'Failed to upload face pattern. Please try again.';
      toast.error(errorMsg);
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="space-y-4">
      {!showWebcam && capturedImages.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={startCapture}
            className="py-6 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="flex flex-col items-center">
              <svg className="w-12 h-12 text-blue-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-base font-semibold text-blue-600">Capture with Webcam</p>
              <p className="text-xs text-gray-500 mt-1">Live camera capture</p>
            </div>
          </button>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative py-6 border-2 border-dashed rounded-lg transition-colors ${
              isDragging 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-300 hover:border-green-500 hover:bg-green-50'
            }`}
          >
            <input
              type="file"
              id="face-upload"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={isTraining}
            />
            <label
              htmlFor="face-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <svg className="w-12 h-12 text-green-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-base font-semibold text-green-600">Upload Face Images</p>
              <p className="text-xs text-gray-500 mt-1">
                {isDragging ? 'Drop images here' : 'Drag & drop or click'}
              </p>
            </label>
          </div>
        </div>
      )}

      {showWebcam && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Progress: {capturedImages.length}/{requiredCount} patterns captured
              </span>
              <button
                type="button"
                onClick={() => setShowWebcam(false)}
                className="text-red-600 hover:text-red-800"
              >
                Close Camera
              </button>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${(capturedImages.length / requiredCount) * 100}%` }}
              ></div>
            </div>
          </div>
          
          {isTraining ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Processing face pattern...</p>
            </div>
          ) : (
            <WebcamCapture 
              onCapture={handleCapture} 
              autoReset={true}
            />
          )}
          
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">
              <strong>Tips:</strong> Capture from different angles - front, slight left, slight right, looking up, looking down. Ensure good lighting and a clear view of your face.
            </p>
          </div>
        </div>
      )}

      {capturedImages.length > 0 && !showWebcam && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">
              Captured Patterns ({capturedImages.length}/{requiredCount})
            </h4>
            <div className="flex gap-2">
              {capturedImages.length < requiredCount && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowWebcam(true)}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    📷 Capture More
                  </button>
                  <label
                    htmlFor="face-upload-more"
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer"
                  >
                    📁 Upload More
                  </label>
                  <input
                    type="file"
                    id="face-upload-more"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isTraining}
                  />
                </>
              )}
              <button
                type="button"
                onClick={retakeAll}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Retake All
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-5 gap-3">
            {capturedImages.map((img, index) => (
              <div key={index} className="relative group">
                <img
                  src={img.data}
                  alt={`Pattern ${index + 1}`}
                  className="w-full h-24 object-cover rounded border-2 border-green-500"
                />
                <button
                  type="button"
                  onClick={() => removePattern(index)}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <span className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-1 rounded">
                  #{index + 1} ({(img.quality * 100).toFixed(0)}%)
                </span>
              </div>
            ))}
            {[...Array(requiredCount - capturedImages.length)].map((_, i) => (
              <div key={`empty-${i}`} className="w-full h-24 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            ))}
          </div>
          
          {capturedImages.length === requiredCount && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-sm text-green-800 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <strong>All patterns captured!</strong> Ready for high-accuracy face recognition.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
