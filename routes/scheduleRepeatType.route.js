import express from "express";
import {
  getScheduleRepeatTypes,
  getScheduleRepeatTypeById,
  createScheduleRepeatType,
  updateScheduleRepeatType,
  deleteScheduleRepeatType,
} from "../controllers/scheduleRepeatType.controller.js";

const router = express.Router();

router.get("/", getScheduleRepeatTypes);
router.get("/:id", getScheduleRepeatTypeById);
router.post("/", createScheduleRepeatType);
router.put("/:id", updateScheduleRepeatType);
router.delete("/:id", deleteScheduleRepeatType);

export default router;
