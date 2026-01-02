import prisma from "../config/prisma.js";
import createError from "../utils/createError.js";
import { sendLineMessage } from "../utils/lineNotify.js";
// controllers/upload.controller.js
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ฟังก์ชันสำหรับ upload buffer ไป Cloudinary
const uploadToCloudinary = (buffer, folder = "transactions") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// Upload รูปภาพเดียว
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "กรุณาเลือกไฟล์รูปภาพ" });
    }

    // Upload ไป Cloudinary
    const result = await uploadToCloudinary(req.file.buffer);

    res.json({
      message: "อัพโหลดรูปภาพสำเร็จ",
      data: {
        url: result.secure_url,
        publicId: result.public_id,
      },
    });
  } catch (error) {
    console.error("Upload image error:", error);
    res.status(500).json({
      message: "เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ",
      error: error.message,
    });
  }
};

// Upload หลายรูปภาพ
export const uploadMultipleImages = async (req, res) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res
        .status(400)
        .json({ message: "กรุณาเลือกไฟล์รูปภาพอย่างน้อย 1 ไฟล์" });
    }

    // Upload ทุกไฟล์ไป Cloudinary
    const uploadPromises = req.files.map((file) =>
      uploadToCloudinary(file.buffer)
    );

    const results = await Promise.all(uploadPromises);

    const urls = results.map((result) => ({
      url: result.secure_url,
      publicId: result.public_id,
    }));

    res.json({
      message: "อัพโหลดรูปภาพสำเร็จ",
      data: urls,
    });
  } catch (error) {
    console.error("Upload multiple images error:", error);
    res.status(500).json({
      message: "เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ",
      error: error.message,
    });
  }
};
