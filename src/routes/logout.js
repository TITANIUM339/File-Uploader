import { Router } from "express";
import { logout } from "../controllers/logout.js";

const router = Router();

router.post("/", logout.post);

export default router;
