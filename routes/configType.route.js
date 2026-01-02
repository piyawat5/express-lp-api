import express from "express";
import {
  getConfigTypes,
  getConfigTypeById,
  createConfigType,
  updateConfigType,
  deleteConfigType,
} from "../controllers/configType.controller.js";

const router = express.Router();

router.get("/", getConfigTypes);
router.get("/:id", getConfigTypeById);
router.post("/", createConfigType);
router.put("/:id", updateConfigType);
router.delete("/:id", deleteConfigType);

export default router;
