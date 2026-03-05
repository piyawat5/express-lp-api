import express from "express";
import {
  getAnalysMissAction,
  getAnalysMissAction2,
} from "../controllers/chatbot.controller.js";

const router = express.Router();
router.get("/getAnalyMissAction", getAnalysMissAction);
router.get("/getAnalyMissAction2", getAnalysMissAction2);

export default router;
