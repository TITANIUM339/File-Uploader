import asyncHandler from "express-async-handler";
import { validateNewFile } from "../lib/validation.js";
import { matchedData, validationResult } from "express-validator";
import prisma from "../lib/client.js";
import isAuthenticated from "../lib/isAuthenticated.js";
import HttpError from "../lib/HttpError.js";
import { addNewFolder } from "../lib/queries.js";

const newFolder = {
    post: [
        isAuthenticated,
        validateNewFile(),
        asyncHandler(async (req, res, next) => {
            if (!validationResult(req).isEmpty()) {
                next(new HttpError("Bad Request", "Invalid input", 400));

                return;
            }

            const { name, path } = matchedData(req);

            const folderPath = [...path, name];

            await prisma.$executeRaw(addNewFolder(folderPath, req.user.homeId));

            res.redirect(`/home/${path.join("/")}`);
        }),
    ],
};

export { newFolder };
