const express = require('express');
const router = express.Router();
const {
  registerFace,
  getMyFaces,
  setPrimaryFace,
  deleteFace
} = require('../controllers/faceController');
const { protect } = require('../middleware/auth');
const { idValidation, validate } = require('../middleware/validation');

router.post('/register', protect, registerFace);
router.get('/my-faces', protect, getMyFaces);
router.put('/:id/set-primary', protect, idValidation, validate, setPrimaryFace);
router.delete('/:id', protect, idValidation, validate, deleteFace);

module.exports = router;
