const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'alumnex_uploads',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'webm', 'mov', 'pdf', 'doc', 'docx'],
    resource_type: 'auto'
  },
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|mp4|webm|mov|pdf|doc|docx/;
    cb(null, allowed.test(file.mimetype) || allowed.test(file.originalname.toLowerCase()));
  }
});

module.exports = { cloudinary, upload };
