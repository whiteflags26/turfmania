import express from "express";
import { login, register,logout,getMe } from "./auth.controller";
import { protect } from "./auth.middleware";

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.post("/logout", logout);

router.get("/me", protect, getMe);

export default router;

