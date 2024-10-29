import { Router } from "express";
import { signup } from "../controllers/signup.js";

const router = Router();

router.route("/").get(signup.get);

export default router;
