import asyncHandler from "express-async-handler";
import { validateNewFolder } from "../lib/validation.js";
import { matchedData, validationResult } from "express-validator";
import prisma from "../lib/client.js";
import isAuthenticated from "../lib/isAuthenticated.js";
import { UTCDate } from "@date-fns/utc";
import { arrayToJsonpath } from "../lib/pathUtilities.js";
import HttpError from "../lib/HttpError.js";

const newFolder = {
    post: [
        isAuthenticated,
        validateNewFolder(),
        asyncHandler(async (req, res, next) => {
            if (!validationResult(req).isEmpty()) {
                next(new HttpError("Bad Request", "Invalid input", 400));

                return;
            }

            const { name, path } = matchedData(req);

            const folderPath = [...path, name];

            const newFolder = {
                $type: "folder",
                $date: new UTCDate(),
            };

            // Insert the new folder only when there is no existing folder with the same name and the provided path leads to an actual folder and not a file
            await prisma.$executeRaw`UPDATE "Home" SET folder = jsonb_insert(folder, ${folderPath}::text[], ${newFolder}::jsonb) WHERE id = ${req.user.homeId} AND NOT jsonb_path_exists(folder, ${arrayToJsonpath(folderPath)}::jsonpath) AND COALESCE(folder #>> ${[...path, "$type"]}::text[], 'folder') = 'folder';`;

            res.redirect(`/home/${path.join("/")}`);
        }),
    ],
};

export { newFolder };
