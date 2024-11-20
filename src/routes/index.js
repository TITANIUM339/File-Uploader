import { Router } from "express";
import { index } from "../controllers/index.js";

const router = Router();

router.get("/", index.get);

export default router;
