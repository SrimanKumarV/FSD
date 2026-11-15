const path = require('path');
const crypto = require('crypto');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const ALLOWED_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'webp',
  'mp4', 'webm', 'mov',
  'pdf', 'doc', 'docx'
]);

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]);

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'alumnex_uploads',
    allowed_formats: Array.from(ALLOWED_EXTENSIONS),
    resource_type: 'auto',
    public_id: (req, file) => crypto.randomBytes(16).toString('hex')
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (!file || !file.originalname) {
      return cb(new Error('Invalid file payload.'));
    }

    const ext = path.extname(file.originalname).toLowerCase().replace(/^\./, '');
    const mime = (file.mimetype || '').toLowerCase();

    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return cb(new Error(`File extension '.${ext}' is not permitted.`));
    }

    if (!ALLOWED_MIME_TYPES.has(mime)) {
      return cb(new Error(`MIME type '${mime}' is not permitted.`));
    }

    cb(null, true);
  }
});

module.exports = { cloudinary, upload, ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES };
