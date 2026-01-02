import express from "express";
import {
  getActions,
  getActionById,
  createAction,
  updateAction,
  deleteAction,
} from "../controllers/action.controller.js";

const router = express.Router();

router.get("/", getActions);
router.get("/:id", getActionById);
router.post("/", createAction);
router.put("/:id", updateAction);
router.delete("/:id", deleteAction);

export default router;
