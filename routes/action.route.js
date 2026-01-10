import express from "express";
import {
  getActions,
  getActionById,
  createAction,
  updateAction,
  deleteAction,
  testMail,
  checkAndNotifyDailyActions,
} from "../controllers/action.controller.js";

const router = express.Router();

router.get("/", getActions);
router.get("/:id", getActionById);
router.post("/", createAction);
router.put("/:id", updateAction);
router.delete("/:id", deleteAction);
router.get("/notification/today", checkAndNotifyDailyActions);
router.post("/test-email", testMail);

export default router;
