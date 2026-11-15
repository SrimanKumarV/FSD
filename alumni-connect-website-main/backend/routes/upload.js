const express = require('express');
const router = express.Router();
const multer = require('multer');
const { upload } = require('../config/cloudinary');
const { protect } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiters');

// @route   POST /api/upload
// @desc    Upload a file to Cloudinary and return the URL
// @access  Private
router.post('/', protect, uploadLimiter, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
        }
        return res.status(400).json({ message: `Upload error: ${err.message}` });
      }
      return res.status(400).json({ message: err.message || 'File upload failed validation.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Cloudinary automatically provides the secure URL in req.file.path
    res.json({ 
      url: req.file.path,
      fileName: req.file.originalname,
      fileSize: req.file.size
    });
  });
});

module.exports = router;
