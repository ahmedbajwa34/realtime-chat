import { Router } from "express";
import rateLimit from "express-rate-limit";
import { register, login, logout, refresh } from "../controllers/auth.controller.js";

const router = Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,                       
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many attempts. Try again later." },
});

const refreshLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
});

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/refresh", refreshLimiter, refresh);
router.post("/logout", logout);
export default router;