import { Router } from "express";
import { deleteFolder, newFolder } from "../controllers/folder.js";

const router = Router();

router.post("/new-folder", newFolder.post);
router.post("/delete-folder", deleteFolder.post);

export default router;
