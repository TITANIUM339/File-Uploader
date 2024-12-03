import { Router } from "express";
import { home } from "../controllers/home.js";
import asyncHandler from "express-async-handler";
import prisma from "../lib/client.js";

const router = Router();

router.use(
    asyncHandler(async (req, res, next) => {
        if (!/^(?:\/[\w\-~.]+)*\/?$/.test(req.path)) {
            next("router");

            return;
        }

        const path = req.path.split("/").filter((value) => value !== "");

        const [result] =
            await prisma.$queryRaw`SELECT jsonb_path_exists(folder, ${path.length ? `$."${path.join('"."')}"` : "$"}::jsonpath) AS exists FROM "Home" WHERE id = ${req.user.homeId};`;

        const { exists } = result;

        if (!exists) {
            next("router");

            return;
        }

        next();
    }),
);

router.route(/^(?:\/[^/]+)*\/?$/).get(home.get);

export default router;
