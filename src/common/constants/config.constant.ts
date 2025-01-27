export const JWT_CONFIG = {
  ACCESS_TOKEN: {
    SECRET: process.env.ACCESS_TOKEN_SECRET,
    EXPIRES: process.env.ACCESS_TOKEN_EXPIRES,
  },
  REFRESH_TOKEN: {
    SECRET: process.env.REFRESH_TOKEN_SECRET,
    EXPIRES: process.env.REFRESH_TOKEN_EXPIRES,
  }
};

export const CLOUDINARY_CONFIG = {
  CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  API_KEY: process.env.CLOUDINARY_API_KEY,
  API_SECRET: process.env.CLOUDINARY_API_SECRET,
};

export const API_CONFIG = {
  DOC_URL: 'https://tuananhdev.click',
};

