import multer from "multer";
import { validateNewFile } from "../lib/validation.js";
import isAuthenticated from "../lib/isAuthenticated.js";
import asyncHandler from "express-async-handler";
import { matchedData, validationResult } from "express-validator";
import HttpError from "../lib/HttpError.js";
import prisma from "../lib/client.js";
import { arrayToJsonpath } from "../lib/pathUtilities.js";
import { unlink } from "fs/promises";
import { pathExists, addNewFile } from "../lib/queries.js";

const upload = multer({ dest: "uploads" });

const newFile = {
    post: [
        isAuthenticated,
        upload.single("file"),
        validateNewFile(),
        asyncHandler(async (req, res, next) => {
            if (!validationResult(req).isEmpty() || !req.file) {
                req.file && (await unlink(req.file.path));

                next(new HttpError("Bad Request", "Invalid input", 400));

                return;
            }

            const { name, path } = matchedData(req);

            const filePath = [...path, name];

            const [[result], rows] = await Promise.all([
                prisma.$queryRaw(
                    pathExists(arrayToJsonpath(path), req.user.homeId),
                ),
                prisma.$executeRaw(
                    addNewFile(filePath, req.file, req.user.homeId),
                ),
            ]);

            const { exists } = result;

            // Remove file if provided path doesn't exist or UPDATE query didn't change anything
            (!exists || !rows) && (await unlink(req.file.path));

            res.redirect(`/home/${path.join("/")}`);
        }),
    ],
};

export { newFile };
