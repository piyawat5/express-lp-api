import express from "express";
import {
  getActionStatuses,
  getActionStatusById,
  createActionStatus,
  updateActionStatus,
  deleteActionStatus,
} from "../controllers/actionStatus.controller.js";

const router = express.Router();

router.get("/", getActionStatuses);
router.get("/:id", getActionStatusById);
router.post("/", createActionStatus);
router.put("/:id", updateActionStatus);
router.delete("/:id", deleteActionStatus);

export default router;
