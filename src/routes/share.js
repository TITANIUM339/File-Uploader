import { Router } from "express";
import { file, folder } from "../controllers/share.js";
import { PATH_PATTERN } from "../lib/constants.js";
import asyncHandler from "express-async-handler";
import prisma from "../lib/client.js";
import { UTCDate } from "@date-fns/utc";
import { pathToArray } from "../lib/pathUtilities.js";
import { isFolder } from "../lib/queries.js";
import { pathExists } from "../lib/queries.js";
import { arrayToJsonpath } from "../lib/pathUtilities.js";

const router = Router();

router.use(
    "/:id",
    asyncHandler(async (req, res, next) => {
        const share = await prisma.share.findUnique({
            where: { id: req.params.id, expiresAt: { gt: new UTCDate() } },
            include: { user: true },
        });

        if (!share) {
            next("router");

            return;
        }

        res.locals.shareId = share.id;
        res.locals.sharePath = share.path;
        res.locals.homeId = share.user.homeId;

        next();
    }),
);

router.get(
    PATH_PATTERN,
    asyncHandler(async (req, res, next) => {
        const path = [
            ...pathToArray(res.locals.sharePath),
            ...pathToArray(req.path).slice(1),
        ];

        const [result] = await prisma.$queryRaw(
            pathExists(arrayToJsonpath(path), res.locals.homeId),
        );

        const { exists } = result;

        if (!exists) {
            next("router");

            return;
        }

        next();
    }),
    asyncHandler(async (req, res, next) => {
        const path = [
            ...pathToArray(res.locals.sharePath),
            ...pathToArray(req.path).slice(1),
        ];

        const [result] = await prisma.$queryRaw(
            isFolder(path, res.locals.homeId),
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
