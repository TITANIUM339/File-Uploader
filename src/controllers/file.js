import multer from "multer";
import { validateNewFolder } from "../lib/validation.js";
import isAuthenticated from "../lib/isAuthenticated.js";
import asyncHandler from "express-async-handler";
import { matchedData, validationResult } from "express-validator";
import HttpError from "../lib/HttpError.js";
import prisma from "../lib/client.js";
import { UTCDate } from "@date-fns/utc";
import { arrayToJsonpath } from "../lib/pathUtilities.js";
import { unlink } from "fs/promises";

const upload = multer({ dest: "uploads" });

const newFile = {
    post: [
        isAuthenticated,
        upload.single("file"),
        validateNewFolder(),
        asyncHandler(async (req, res, next) => {
            if (!validationResult(req).isEmpty() || !req.file) {
                req.file && (await unlink(req.file.path));

                next(new HttpError("Bad Request", "Invalid input", 400));

                return;
            }

            const { name, path } = matchedData(req);

            const filePath = [...path, name];

            const newFile = {
                $type: "file",
                $mimeType: req.file.mimetype,
                $size: req.file.size,
                $location: req.file.path,
                $extension:
                    /^.+\.([A-Za-z0-9]+)$/
                        .exec(req.file.originalname)?.[1]
                        .toLowerCase() || null,
                $date: new UTCDate(),
            };

            const [[result], rows] = await Promise.all([
                prisma.$queryRaw`SELECT jsonb_path_exists(folder, ${arrayToJsonpath(path)}::jsonpath) AS exists FROM "Home" WHERE id = ${req.user.homeId};`,
                prisma.$executeRaw`UPDATE "Home" SET folder = jsonb_insert(folder, ${filePath}::text[], ${newFile}::jsonb) WHERE id = ${req.user.homeId} AND NOT jsonb_path_exists(folder, ${arrayToJsonpath(filePath)}::jsonpath) AND COALESCE(folder #>> ${[...path, "$type"]}::text[], 'folder') = 'folder';`,
            ]);

            const { exists } = result;

            // Remove file if provided path doesn't exist or UPDATE query didn't change anything
            (!exists || !rows) && (await unlink(req.file.path));

            res.redirect(`/home/${path.join("/")}`);
        }),
    ],
};

export { newFile };
