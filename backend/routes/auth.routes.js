import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import { registerUser, loginUser, getMe, updateProfile } from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);

export default router;