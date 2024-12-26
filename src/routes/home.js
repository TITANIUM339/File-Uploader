import { Router } from "express";
import { file, folder } from "../controllers/home.js";
import asyncHandler from "express-async-handler";
import prisma from "../lib/client.js";
import { arrayToJsonpath, pathToArray } from "../lib/pathUtilities.js";
import isAuthenticated from "../lib/isAuthenticated.js";
import { PATH_PATTERN } from "../lib/constants.js";

const router = Router();

router.use(isAuthenticated);

router.get(
    PATH_PATTERN,
    asyncHandler(async (req, res, next) => {
        const path = pathToArray(req.path);

        const [result] =
            await prisma.$queryRaw`SELECT jsonb_path_exists(folder, ${arrayToJsonpath(path)}::jsonpath) AS exists FROM "Home" WHERE id = ${req.user.homeId};`;

        const { exists } = result;

        if (!exists) {
            next("router");

            return;
        }

        next();
    }),
    asyncHandler(async (req, res, next) => {
        const path = pathToArray(req.path);

        const [result] =
            await prisma.$queryRaw`SELECT COALESCE(folder #>> ${[...path, "$type"]}::text[], 'folder') = 'folder' AS "isFolder" FROM "Home" WHERE id = ${req.user.homeId};`;

        const { isFolder } = result;

        if (!isFolder) {
            next("route");

            return;
        }

        next();
    }),
    folder.get,
);
router.get(PATH_PATTERN, file.get);

export default router;
