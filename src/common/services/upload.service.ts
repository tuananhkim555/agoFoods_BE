import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { CLOUDINARY_CONFIG } from '../constants/config.constant';

@Injectable()
export class UploadService {
  constructor() {
    cloudinary.config({
      cloud_name: CLOUDINARY_CONFIG.CLOUD_NAME,
      api_key: CLOUDINARY_CONFIG.API_KEY,
      api_secret: CLOUDINARY_CONFIG.API_SECRET,
    });
  }

  async uploadImage(file: Express.Multer.File, folder: string) {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder,
            resource_type: 'auto',
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result?.secure_url || null);
          },
        )
        .end(file.buffer);
    });
  }
}
