import { Router } from "express";
import { deleteFile, download, newFile, rename } from "../controllers/file.js";

const router = Router();

router.post("/new-file", newFile.post);
router.post("/download", download.post);
router.post("/delete-file", deleteFile.post);
router.post("/rename", rename.post);

export default router;
