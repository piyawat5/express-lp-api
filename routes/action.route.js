import express from "express";
import {
  getActions,
  getActionById,
  createAction,
  updateAction,
  deleteAction,
  testMail,
  checkAndNotifyDailyActions,
  checkAndNotifyUpcomingActions,
  getCurrentActions,
  getRecentActions,
  copyActions,
} from "../controllers/action.controller.js";

const router = express.Router();
router.get("/notification/today", checkAndNotifyDailyActions);
router.get("/notification/upcoming", checkAndNotifyUpcomingActions);
router.post("/test-email", testMail);
router.get("/current", getCurrentActions);
router.get("/recent", getRecentActions);

router.get("/", getActions);
router.get("/:id", getActionById);
router.post("/copy", copyActions);
router.post("/", createAction);
router.put("/:id", updateAction);
router.delete("/:id", deleteAction);

export default router;
