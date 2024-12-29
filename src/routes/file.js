import { Router } from "express";
import { deleteFile, download, newFile } from "../controllers/file.js";

const router = Router();

router.post("/new-file", newFile.post);
router.post("/download", download.post);
router.post("/delete-file", deleteFile.post);

export default router;
