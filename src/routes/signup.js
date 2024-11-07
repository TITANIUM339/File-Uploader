import { Router } from "express";
import { signup } from "../controllers/signup.js";

const router = Router();

router.route("/").get(signup.get).post(signup.post);

export default router;
