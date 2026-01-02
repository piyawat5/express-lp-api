import express from "express";
import {
  getConfigs,
  getConfigById,
  createConfig,
  updateConfig,
  deleteConfig,
} from "../controllers/config.controller.js";

const router = express.Router();

router.get("/", getConfigs);
router.get("/:id", getConfigById);
router.post("/", createConfig);
router.put("/:id", updateConfig);
router.delete("/:id", deleteConfig);

export default router;
