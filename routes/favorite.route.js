// favoriteRoute.js - ตัวอย่าง routes สำหรับ Favorite
import express from "express";
import {
  getFavorites,
  getFavoriteById,
  createFavorite,
  deleteFavorite,
  deleteFavoriteByUserAndAction,
} from "../controllers/favorite.controller.js";

const router = express.Router();

// GET /api/favorites?userId=xxx - ดึง favorites ทั้งหมดของ user
router.get("/", getFavorites);

// GET /api/favorites/:id - ดึง favorite ตาม id
router.get("/:id", getFavoriteById);

// POST /api/favorites - เพิ่ม favorite
// Body: { userId, actionId }
router.post("/", createFavorite);

// DELETE /api/favorites/:id - ลบ favorite ตาม id
router.delete("/:id", deleteFavorite);

// DELETE /api/favorites/remove - ลบ favorite ตาม userId และ actionId
// Body: { userId, actionId }
router.delete("/remove", deleteFavoriteByUserAndAction);

export default router;
