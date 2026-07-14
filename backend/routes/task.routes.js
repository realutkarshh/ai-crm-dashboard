import { Router } from "express";
import {protect} from "../middleware/auth.middleware.js";
import { getTasks, createTask, updateTask, deleteTask } from "../controllers/task.controller.js";

const router = Router();
router.use(protect);

router.route("/").get(getTasks).post(createTask);
router.route("/:id").put(updateTask).delete(deleteTask);

export default router;