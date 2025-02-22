import { v2 as cloudinary } from 'cloudinary';
import * as multer from 'multer';
import * as sharp from 'sharp';
import { CLOUDINARY_CONFIG } from '../constants/config.constant';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: CLOUDINARY_CONFIG.CLOUD_NAME,
  api_key: CLOUDINARY_CONFIG.API_KEY,
  api_secret: CLOUDINARY_CONFIG.API_SECRET,
});

const storageAvatarUser = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'avatar-users',
  } as any,
});

export default storageAvatarUser;


// Cấu hình Multer lưu ảnh vào RAM
const storage = multer.memoryStorage();
export const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Giới hạn 10MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      throw new Error('Chỉ chấp nhận file ảnh');
    }
    cb(null, true);
  },
}).single('avatar');

