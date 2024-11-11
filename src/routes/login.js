import { Router } from "express";
import { login } from "../controllers/login.js";

const router = Router();

router.route("/").get(login.get).post(login.post);

export default router;
