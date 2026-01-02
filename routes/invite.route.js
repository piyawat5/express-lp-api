import express from "express";
import {
  inviteUsersToAction,
  updateInviteStatus,
  deleteInvite,
} from "../controllers/invite.controller.js";

const router = express.Router();

router.post("/actions/:actionId/invites", inviteUsersToAction);
router.put("/invites/:id", updateInviteStatus);
router.delete("/invites/:id", deleteInvite);

export default router;
