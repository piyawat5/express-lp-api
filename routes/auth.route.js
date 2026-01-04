import express from "express";
import { register } from "../controllers/authCookie.controller.js";
import { registerSchema, loginSchema, validate } from "../utils/validator.js";

import { login, authen } from "../controllers/authCookie.controller.js";
import {
  uploadImage,
  uploadMultipleImages,
} from "../controllers/attachFile.controller.js";
import verifyToken from "../config/verify.js";
import multer from "multer";

import tempUserRoute from "./tempUser.route.js";
import actionRoute from "./action.route.js";
import inviteRoute from "./invite.route.js";
import configRoute from "./config.route.js";
import configTypeRoute from "./configType.route.js";
import actionStatusRoute from "./actionStatus.route.js";
import inviteStatusRoute from "./inviteStatus.route.js";
import notiActionRoute from "./notiAction.route.js";
import scheduleRepeatTypeRoute from "./scheduleRepeatType.route.js";

// ใช้ memory storage สำหรับ multer (เก็บไว้ใน memory ก่อนส่งไป Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // จำกัด 5MB
  },
  fileFilter: (req, file, cb) => {
    console.log("01");
    // ยอมรับเฉพาะไฟล์รูปภาพ
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("อนุญาตเฉพาะไฟล์รูปภาพเท่านั้น"));
    }
  },
});

const router = express.Router();

// ------------- auth --------------
router.post("/auth/register", validate(registerSchema), register);
router.post("/auth/login", login);
router.post("/auth/verify", authen);

router.use("/actions", actionRoute);

router.use("/temp-users", tempUserRoute);

router.use("/", inviteRoute);
router.use("/configs", configRoute);
router.use("/config-types", configTypeRoute);
router.use("/action-statuses", actionStatusRoute);
router.use("/invite-statuses", inviteStatusRoute);
router.use("/noti-actions", notiActionRoute);
router.use("/schedule-repeat-types", scheduleRepeatTypeRoute);

// ------------- upload --------------
router.post("/single", verifyToken, upload.single("image"), uploadImage);
router.post(
  "/multiple",
  verifyToken,
  upload.array("images", 10),
  uploadMultipleImages
);

export default router;
