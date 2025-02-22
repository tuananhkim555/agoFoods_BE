import { v2 as cloudinary } from 'cloudinary';
import * as multer from 'multer';
import * as sharp from 'sharp';
import { CLOUDINARY_CONFIG } from '../constants/config.constant';

// Cấu hình Cloudinary
cloudinary.config({
    cloud_name: CLOUDINARY_CONFIG.CLOUD_NAME,
    api_key: CLOUDINARY_CONFIG.API_KEY,
    api_secret: CLOUDINARY_CONFIG.API_SECRET,
});

export async function compressAndUploadImage(file: Express.Multer.File): Promise<string> {
    if (!file || !file.buffer) {
      throw new Error('File buffer không hợp lệ');
    }
  
    try {
      const compressedBuffer = await sharp(file.buffer)
        .resize(500, 500, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toBuffer();
  
      return new Promise<string>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'avatar-users', format: 'jpeg' },
          (error, result) => {
            if (error) {
              console.error('Lỗi upload Cloudinary:', error);
              return reject(new Error('Lỗi khi upload lên Cloudinary'));
            }
            if (!result?.secure_url) {
              return reject(new Error('Cloudinary không trả về URL hợp lệ'));
            }
            resolve(result.secure_url);
          }
        );
  
        uploadStream.end(compressedBuffer);
      });
    } catch (error) {
      throw new Error('Lỗi nén ảnh: ' + error.message);
    }
  }