import asyncHandler from "express-async-handler";
import { validateNewFolder } from "../lib/validation.js";
import { matchedData, validationResult } from "express-validator";
import prisma from "../lib/client.js";
import isAuthenticated from "../lib/isAuthenticated.js";
import { UTCDate } from "@date-fns/utc";
import { arrayToJsonpath } from "../lib/pathUtilities.js";

const newFolder = {
    post: [
        isAuthenticated,
        validateNewFolder(),
        asyncHandler(async (req, res) => {
            const error = validationResult(req);

            if (!error.isEmpty()) {
                const errors = error.array({ onlyFirstError: true });

                res.render("home", {
                    newFolderError: true,
                    nameError: errors[0].msg,
                    name: req.body.name,
                    path: req.body.path,
                });

                return;
            }

            const { name, path } = matchedData(req);

            const folderPath = [...path, name];

            const newFolder = {
                $type: "folder",
                $date: new UTCDate(),
            };

            await prisma.$executeRaw`UPDATE "Home" SET folder = jsonb_insert(folder, ${folderPath}::text[], ${newFolder}::jsonb) WHERE id = ${req.user.homeId} AND NOT jsonb_path_exists(folder, ${arrayToJsonpath(folderPath)}::jsonpath);`;

            res.redirect(`/home/${path.join("/")}`);
        }),
    ],
};

export { newFolder };
