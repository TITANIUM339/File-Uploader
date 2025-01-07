import multer from "multer";
import {
    validatePath,
    validateNewFile,
    validateFileShare,
    validateStopFileShare,
} from "../lib/validation.js";
import isAuthenticated from "../lib/isAuthenticated.js";
import asyncHandler from "express-async-handler";
import { matchedData, validationResult } from "express-validator";
import HttpError from "../lib/HttpError.js";
import prisma from "../lib/client.js";
import { arrayToJsonpath, pathToArray } from "../lib/pathUtilities.js";
import { unlink } from "fs/promises";
import {
    pathExists,
    addNewFile,
    getFiles,
    removeFile,
    renameFile,
    setFileShareId,
    isFileShared,
    removeFileShareId,
} from "../lib/queries.js";
import nodePath from "path";
import { UTCDate } from "@date-fns/utc";

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
        validatePath(),
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

            if (result?.items.$type === "file") {
                const { items: file } = result;

                await Promise.all([
                    unlink(file.$location),
                    prisma.$executeRaw(removeFile(path, req.user.homeId)),
                    file.$shareId &&
                        prisma.share.delete({
                            where: { id: file.$shareId },
                        }),
                ]);
            }

            res.redirect(`/home/${path.slice(0, path.length - 1).join("/")}`);
        }),
    ],
};

const rename = {
    post: [
        isAuthenticated,
        validateNewFile(),
        asyncHandler(async (req, res, next) => {
            if (!validationResult(req).isEmpty()) {
                next(new HttpError("Bad Request", "Invalid input", 400));

                return;
            }

            const { path, name } = matchedData(req);

            await prisma.$executeRaw(renameFile(path, name, req.user.homeId));

            res.redirect(
                `/home/${[...path.slice(0, path.length - 1), name].join("/")}`,
            );
        }),
    ],
};

const share = {
    post: [
        isAuthenticated,
        validateFileShare(),
        asyncHandler(async (req, res, next) => {
            const { path, days } = matchedData(req);

            if (
                !validationResult(req).isEmpty() ||
                !(
                    await prisma.$queryRaw(
                        pathExists(arrayToJsonpath(path), req.user.homeId),
                    )
                )[0].exists ||
                (await prisma.$queryRaw(isFileShared(path, req.user.homeId)))[0]
                    .shared
            ) {
                next(new HttpError("Bad Request", "Invalid input", 400));

                return;
            }

            const date = new UTCDate();

            date.setDate(date.getDate() + days);

            const { id } = await prisma.share.create({
                data: {
                    path: `/${path.join("/")}`,
                    expiresAt: date,
                    userId: req.user.id,
                },
            });

            await prisma.$executeRaw(setFileShareId(path, id, req.user.homeId));

            res.redirect(`/home/${path.join("/")}`);
        }),
    ],
};

const stopSharing = {
    post: [
        isAuthenticated,
        validateStopFileShare(),
        asyncHandler(async (req, res, next) => {
            if (!validationResult(req).isEmpty()) {
                next(new HttpError("Bad Request", "Invalid input", 400));

                return;
            }

            const { id } = matchedData(req);

            const share = await prisma.share.findUnique({
                where: { id, userId: req.user.id },
            });

            share &&
                (await prisma.$transaction([
                    prisma.share.delete({ where: { id, userId: req.user.id } }),
                    prisma.$executeRaw(
                        removeFileShareId(
                            pathToArray(share.path),
                            req.user.homeId,
                        ),
                    ),
                ]));

            res.redirect(`/home${share?.path || ""}`);
        }),
    ],
};

export { newFile, download, deleteFile, rename, share, stopSharing };
