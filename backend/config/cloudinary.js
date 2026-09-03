require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'x676nxoa',
  api_key: process.env.CLOUDINARY_API_KEY || '761253354223237',
  api_secret: process.env.CLOUDINARY_API_SECRET || '6k_Q2eg_YYJlMe7tUOWulj4GI5I'
});

module.exports = cloudinary;
