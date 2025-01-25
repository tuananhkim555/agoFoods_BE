import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Configuration
cloudinary.config({
  cloud_name: 'ddaofgdke',
  api_key: '765745499357567',
  api_secret: 'JwGX3gxUMrKbPAH6Ts0-BJsrBpQ', // Click 'View API Keys' above to copy your API secret
});

const storageCloud = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'images',
  } as any,
});

export default storageCloud;
