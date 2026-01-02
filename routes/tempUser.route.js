import express from "express";
import {
  getTempUsers,
  getTempUserById,
  createTempUser,
  updateTempUser,
  deleteTempUser,
} from "../controllers/tempUser.controller.js";

const router = express.Router();

router.get("/", getTempUsers);
router.get("/:id", getTempUserById);
router.post("/", createTempUser);
router.put("/:id", updateTempUser);
router.delete("/:id", deleteTempUser);

export default router;
