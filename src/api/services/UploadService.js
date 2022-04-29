const multer = require('multer');
const path = require('path');

class UploadService {
  static upload(fieldName) {
    const storage = multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, path.join(__dirname, '../../uploads')),
      filename: (req, _file, cb) => cb(null, `${req.params.id}.jpeg`),
    });

    const upload = multer({
      storage,
      fileFilter: (_req, file, callback) => {
        const ext = path.extname(file.originalname);
        if (ext !== '.jpeg' && ext !== '.jpg') {
          return callback(new Error('Only jpeg/jpg are allowed'));
        }
        callback(null, true);
      },
    });

    return upload.single(fieldName);
  }
}

module.exports = UploadService;