import { Router } from "express";
import { file, folder } from "../controllers/home.js";
import asyncHandler from "express-async-handler";
import prisma from "../lib/client.js";
import { arrayToJsonpath, pathToArray } from "../lib/pathUtilities.js";
import isAuthenticated from "../lib/isAuthenticated.js";
import { PATH_PATTERN } from "../lib/constants.js";
import { isFolder, pathExists } from "../lib/queries.js";

const router = Router();

router.use(isAuthenticated);

router.get(
    PATH_PATTERN,
    asyncHandler(async (req, res, next) => {
        const path = pathToArray(req.path);

        const [result] = await prisma.$queryRaw(
            pathExists(arrayToJsonpath(path), req.user.homeId),
        );

        const { exists } = result;

        if (!exists) {
            next("router");

            return;
        }

        next();
    }),
    asyncHandler(async (req, res, next) => {
        const path = pathToArray(req.path);

        const [result] = await prisma.$queryRaw(
            isFolder(path, req.user.homeId),
        );

        const { folder } = result;

        if (!folder) {
            next("route");

            return;
        }

        next();
    }),
    folder.get,
);
router.get(PATH_PATTERN, file.get);

export default router;
