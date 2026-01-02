import express from "express";
import {
  getInviteStatuses,
  getInviteStatusById,
  createInviteStatus,
  updateInviteStatus,
  deleteInviteStatus,
} from "../controllers/inviteStatus.controller.js";

const router = express.Router();

router.get("/", getInviteStatuses);
router.get("/:id", getInviteStatusById);
router.post("/", createInviteStatus);
router.put("/:id", updateInviteStatus);
router.delete("/:id", deleteInviteStatus);

export default router;
