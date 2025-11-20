const FaceEmbedding = require('../models/FaceEmbedding');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'face-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: process.env.MAX_FILE_SIZE || 5 * 1024 * 1024 }, // 5MB
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPEG, JPG, and PNG images are allowed'));
    }
  }
}).single('image');

// @desc    Register face
// @route   POST /api/face/register
// @access  Private
exports.registerFace = asyncHandler(async (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const userId = req.user.userId;
    const user = await User.findOne({ userId });

    // Check if user has reached maximum faces
    const existingFaces = await FaceEmbedding.countDocuments({ userId, status: 'active' });
    const maxFaces = parseInt(process.env.MAX_FACES_PER_USER) || 5;

    if (existingFaces >= maxFaces) {
      // Delete uploaded file
      fs.unlinkSync(req.file.path);
      
      return res.status(400).json({
        success: false,
        message: `Maximum ${maxFaces} face registrations allowed per user`
      });
    }

    try {
      // Read file and convert to base64
      const imageBuffer = fs.readFileSync(req.file.path);
      const base64Image = imageBuffer.toString('base64');

      // Call ML service to extract embedding
      const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
      const response = await axios.post(`${mlServiceUrl}/extract-embedding`, {
        image: base64Image
      }, {
        timeout: 15000
      });

      if (!response.data.success) {
        // Delete uploaded file
        fs.unlinkSync(req.file.path);
        
        return res.status(400).json({
          success: false,
          message: response.data.message || 'Face extraction failed'
        });
      }

      const { embedding, quality_score, metadata } = response.data.data;

      // Save embedding to database
      const faceEmbedding = await FaceEmbedding.create({
        userId: userId,
        embedding: embedding,
        image_url: req.file.path,
        quality_score: quality_score,
        is_primary: existingFaces === 0, // First face is primary
        metadata: metadata
      });

      // Update user's registered_faces count
      user.registered_faces = existingFaces + 1;
      await user.save();

      res.status(201).json({
        success: true,
        message: 'Face registered successfully',
        data: {
          embeddingId: faceEmbedding._id,
          quality_score: quality_score,
          is_primary: faceEmbedding.is_primary,
          total_faces: user.registered_faces
        }
      });

    } catch (error) {
      // Delete uploaded file on error
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      console.error('Face registration error:', error.message);
      
      return res.status(500).json({
        success: false,
        message: 'Face registration failed. Please try again.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });
});

// @desc    Get my face embeddings
// @route   GET /api/face/my-faces
// @access  Private
exports.getMyFaces = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  
  const embeddings = await FaceEmbedding.getActiveEmbeddings(userId);

  res.status(200).json({
    success: true,
    data: {
      count: embeddings.length,
      embeddings: embeddings.map(e => ({
        id: e._id,
        captured_at: e.captured_at,
        quality_score: e.quality_score,
        is_primary: e.is_primary,
        image_url: e.image_url
      }))
    }
  });
});

// @desc    Set primary face
// @route   PUT /api/face/:id/set-primary
// @access  Private
exports.setPrimaryFace = asyncHandler(async (req, res) => {
  const embeddingId = req.params.id;
  const userId = req.user.userId;

  // Verify embedding belongs to user
  const embedding = await FaceEmbedding.findOne({ _id: embeddingId, userId, status: 'active' });

  if (!embedding) {
    return res.status(404).json({
      success: false,
      message: 'Face embedding not found'
    });
  }

  await FaceEmbedding.setPrimary(embeddingId, userId);

  res.status(200).json({
    success: true,
    message: 'Primary face updated successfully'
  });
});

// @desc    Delete face embedding
// @route   DELETE /api/face/:id
// @access  Private
exports.deleteFace = asyncHandler(async (req, res) => {
  const embeddingId = req.params.id;
  const userId = req.user.userId;

  const embedding = await FaceEmbedding.findOne({ _id: embeddingId, userId });

  if (!embedding) {
    return res.status(404).json({
      success: false,
      message: 'Face embedding not found'
    });
  }

  // Mark as deleted
  embedding.status = 'deleted';
  await embedding.save();

  // Delete image file if exists
  if (embedding.image_url && fs.existsSync(embedding.image_url)) {
    fs.unlinkSync(embedding.image_url);
  }

  // Update user's registered_faces count
  const activeCount = await FaceEmbedding.countDocuments({ userId, status: 'active' });
  await User.findOneAndUpdate({ userId }, { registered_faces: activeCount });

  res.status(200).json({
    success: true,
    message: 'Face embedding deleted successfully'
  });
});
