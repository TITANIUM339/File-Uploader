import { Router } from "express";
import { download, newFile } from "../controllers/file.js";

const router = Router();

router.post("/new-file", newFile.post);
router.post("/download", download.post);

export default router;
