import { Router } from "express";
import { newFile } from "../controllers/file.js";

const router = Router();

router.post("/new-file", newFile.post);

export default router;
