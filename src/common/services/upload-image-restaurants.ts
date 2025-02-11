import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { CLOUDINARY_CONFIG } from '../constants/config.constant';

// Configuration
cloudinary.config({
  cloud_name: CLOUDINARY_CONFIG.CLOUD_NAME,
  api_key: CLOUDINARY_CONFIG.API_KEY,
  api_secret: CLOUDINARY_CONFIG.API_SECRET,
});

const storageRestaurants = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'restaurants-images',
  } as any,
});

export default storageRestaurants;
