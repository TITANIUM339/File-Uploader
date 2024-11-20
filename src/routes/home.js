import { Router } from "express";
import { home } from "../controllers/home.js";

const router = Router();

router.route(/^(?:\/[^/]+)*\/?$/).get(home.get);

export default router;
