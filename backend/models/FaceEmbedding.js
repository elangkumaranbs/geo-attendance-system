const mongoose = require('mongoose');

const FaceEmbeddingSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    index: true,
    ref: 'User'
  },
  embedding: {
    type: [Number],
    required: true,
    validate: {
      validator: function(arr) {
        return arr.length === 128 || arr.length === 512; // Support both 128-D and 512-D embeddings
      },
      message: 'Embedding must be either 128 or 512 dimensions'
    }
  },
  embedding_version: {
    type: String,
    default: 'facenet_v1',
    required: true
  },
  image_url: {
    type: String,
    trim: true,
    default: null
  },
  image_hash: {
    type: String,
    unique: true,
    sparse: true // Allow null values
  },
  captured_at: {
    type: Date,
    required: true,
    default: Date.now
  },
  quality_score: {
    type: Number,
    min: 0,
    max: 1,
    default: null
  },
  is_primary: {
    type: Boolean,
    default: false
  },
  metadata: {
    face_size: {
      width: Number,
      height: Number
    },
    face_landmarks: mongoose.Schema.Types.Mixed,
    detection_confidence: Number,
    capture_device: String,
    lighting_condition: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'deleted'],
    default: 'active'
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'face_embeddings'
});

// Indexes for efficient queries
FaceEmbeddingSchema.index({ userId: 1, status: 1 });
FaceEmbeddingSchema.index({ userId: 1, is_primary: 1 });
FaceEmbeddingSchema.index({ created_at: -1 });

// Pre-save hook to ensure only one primary embedding per user
FaceEmbeddingSchema.pre('save', async function(next) {
  if (this.is_primary && this.isNew) {
    // Remove primary flag from other embeddings of this user
    await this.constructor.updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { $set: { is_primary: false } }
    );
  }
  next();
});

// Static method to get active embeddings for a user
FaceEmbeddingSchema.statics.getActiveEmbeddings = function(userId) {
  return this.find({
    userId,
    status: 'active'
  }).sort({ is_primary: -1, created_at: -1 });
};

// Static method to get primary embedding
FaceEmbeddingSchema.statics.getPrimaryEmbedding = function(userId) {
  return this.findOne({
    userId,
    is_primary: true,
    status: 'active'
  });
};

// Static method to set primary embedding
FaceEmbeddingSchema.statics.setPrimary = async function(embeddingId, userId) {
  // Remove primary from all embeddings
  await this.updateMany(
    { userId },
    { $set: { is_primary: false } }
  );
  
  // Set new primary
  return this.findByIdAndUpdate(
    embeddingId,
    { $set: { is_primary: true } },
    { new: true }
  );
};

// Static method to delete old embeddings (keep only latest N)
FaceEmbeddingSchema.statics.cleanupOldEmbeddings = async function(userId, keepCount = 5) {
  const embeddings = await this.find({ userId, status: 'active' })
    .sort({ created_at: -1 });
  
  if (embeddings.length > keepCount) {
    const toDelete = embeddings.slice(keepCount).map(e => e._id);
    await this.updateMany(
      { _id: { $in: toDelete } },
      { $set: { status: 'deleted' } }
    );
  }
};

// Method to calculate cosine similarity with another embedding
FaceEmbeddingSchema.methods.calculateSimilarity = function(otherEmbedding) {
  if (this.embedding.length !== otherEmbedding.length) {
    throw new Error('Embeddings must have the same dimension');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < this.embedding.length; i++) {
    dotProduct += this.embedding[i] * otherEmbedding[i];
    normA += this.embedding[i] * this.embedding[i];
    normB += otherEmbedding[i] * otherEmbedding[i];
  }
  
  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return similarity;
};

module.exports = mongoose.model('FaceEmbedding', FaceEmbeddingSchema);
