import { Router } from "express";
import * as authController from "../controller/auth.controller.js";

const authRouter = Router();

/**
 * POST - /api/auth/register
*/
authRouter.post("/register", authController.register);

/**
 * POST - /api/auth/verify-otp
 */
authRouter.post("/verify-otp", authController.verifyOtp);

export default authRouter;
