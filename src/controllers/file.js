import multer from "multer";
import { validateDownload, validateNewFile } from "../lib/validation.js";
import isAuthenticated from "../lib/isAuthenticated.js";
import asyncHandler from "express-async-handler";
import { matchedData, validationResult } from "express-validator";
import HttpError from "../lib/HttpError.js";
import prisma from "../lib/client.js";
import { arrayToJsonpath } from "../lib/pathUtilities.js";
import { unlink } from "fs/promises";
import {
    pathExists,
    addNewFile,
    getFiles,
    removeFile,
} from "../lib/queries.js";
import nodePath from "path";

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

const download = {
    post: [
        isAuthenticated,
        validateDownload(),
        asyncHandler(async (req, res, next) => {
            const { path } = matchedData(req);

            if (
                !validationResult(req).isEmpty() ||
                !(
                    await prisma.$queryRaw(
                        pathExists(arrayToJsonpath(path), req.user.homeId),
                    )
                )[0].exists
            ) {
                next(new HttpError("Bad Request", "Invalid input", 400));

                return;
            }

            const [result] = await prisma.$queryRaw(
                getFiles(arrayToJsonpath(path), req.user.homeId),
            );

            const { items: file } = result;

            res.download(
                nodePath.resolve(file.$location),
                file.$extension
                    ? `${path[path.length - 1]}.${file.$extension}`
                    : path[path.length - 1],
            );
        }),
    ],
};

const deleteFile = {
    post: [
        isAuthenticated,
        validateDownload(),
        asyncHandler(async (req, res, next) => {
            const { path } = matchedData(req);

            if (!validationResult(req).isEmpty()) {
                next(new HttpError("Bad Request", "Invalid input", 400));

                return;
            }

            const [result] = await prisma.$queryRaw(
                getFiles(arrayToJsonpath(path), req.user.homeId),
            );

            if (result) {
                const { items: file } = result;

                file.$location && (await unlink(file.$location));

                await prisma.$executeRaw(removeFile(path, req.user.homeId));
            }

            res.redirect(`/home/${path.slice(0, path.length - 1).join("/")}`);
        }),
    ],
};

export { newFile, download, deleteFile };
