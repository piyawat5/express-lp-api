import express from "express";
import {
  getNotiActions,
  getNotiActionById,
  createNotiAction,
  updateNotiAction,
  deleteNotiAction,
} from "../controllers/notiAction.controller.js";

const router = express.Router();

router.get("/", getNotiActions);
router.get("/:id", getNotiActionById);
router.post("/", createNotiAction);
router.put("/:id", updateNotiAction);
router.delete("/:id", deleteNotiAction);

export default router;
