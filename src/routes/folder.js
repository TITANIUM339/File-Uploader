import { Router } from "express";
import { newFolder } from "../controllers/folder.js";

const router = Router();

router.post("/new-folder", newFolder.post);

export default router;
