import { Router } from "express";
import { home } from "../controllers/home.js";
import asyncHandler from "express-async-handler";
import prisma from "../lib/client.js";
import { arrayToJsonpath, pathToArray } from "../lib/pathUtilities.js";

const router = Router();

router.use(
    /^(?:\/[\w\-~.]+)*\/?$/,
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
);

router.get(/^(?:\/[\w\-~.]+)*\/?$/, home.get);

export default router;
