import asyncHandler from "express-async-handler";
import { validateNewFile, validatePath } from "../lib/validation.js";
import { matchedData, validationResult } from "express-validator";
import prisma from "../lib/client.js";
import isAuthenticated from "../lib/isAuthenticated.js";
import HttpError from "../lib/HttpError.js";
import { addNewFolder, removeFile } from "../lib/queries.js";
import { getFiles } from "../lib/queries.js";
import { arrayToJsonpath } from "../lib/pathUtilities.js";
import { unlink } from "fs/promises";

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

const deleteFolder = {
    post: [
        isAuthenticated,
        validatePath(),
        asyncHandler(async (req, res, next) => {
            if (!validationResult(req).isEmpty()) {
                next(new HttpError("Bad Request", "Invalid input", 400));

                return;
            }

            const { path } = matchedData(req);

            const [result] = await prisma.$queryRaw(
                getFiles(arrayToJsonpath(path), req.user.homeId),
            );

            if (result?.items.$type === "folder") {
                const { items: folder } = result;

                const stack = [folder];

                const filesToDelete = [];

                while (stack.length) {
                    const currentFolder = stack.pop();

                    Object.keys(currentFolder).forEach((item) => {
                        if (currentFolder[item].$type === "folder") {
                            stack.push(currentFolder[item]);
                        } else if (currentFolder[item].$type === "file") {
                            filesToDelete.push(currentFolder[item].$location);
                        }
                    });
                }

                await Promise.all([
                    ...filesToDelete.map((file) => unlink(file)),
                    prisma.$executeRaw(removeFile(path, req.user.homeId)),
                ]);
            }

            res.redirect(`/home/${path.slice(0, path.length - 1).join("/")}`);
        }),
    ],
};

export { newFolder, deleteFolder };
