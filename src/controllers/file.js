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
import cloudinary from "../lib/cloudinary.js";
import {
    pathExists,
    addNewFile,
    getFiles,
    removeFile,
    renameFile,
    setFileShareId,
    isFileShared,
    removeFileShareId,
    isFolder,
} from "../lib/queries.js";
import { UTCDate } from "@date-fns/utc";

const upload = multer({
    storage: multer.diskStorage({}),
    limits: { fileSize: 100000000 },
});

const newFile = {
    post: [
        isAuthenticated,
        (req, res, next) => {
            upload.single("file")(req, res, (error) => {
                if (error instanceof multer.MulterError) {
                    switch (error.code) {
                        case "LIMIT_FILE_SIZE":
                            next(
                                new HttpError(
                                    "Bad Request",
                                    "File too large",
                                    400,
                                ),
                            );

                            return;
                    }
                }

                next(error);
            });
        },
        validateNewFile(),
        asyncHandler(async (req, res, next) => {
            if (!validationResult(req).isEmpty() || !req.file) {
                next(new HttpError("Bad Request", "Invalid input", 400));

                return;
            }

            const { name, path } = matchedData(req);

            const filePath = [...path, name];

            const [[result1], [result2], [result3]] = await Promise.all([
                prisma.$queryRaw(
                    pathExists(arrayToJsonpath(path), req.user.homeId),
                ),
                prisma.$queryRaw(isFolder(path, req.user.homeId)),
                prisma.$queryRaw(
                    pathExists(arrayToJsonpath(filePath), req.user.homeId),
                ),
            ]);

            if (result1.exists && result2.folder && !result3.exists) {
                let result;

                try {
                    result = await cloudinary.uploader.upload(req.file.path, {
                        type: "authenticated",
                        resource_type: "auto",
                    });
                } catch (error) {
                    if (error.http_code === 400) {
                        next(
                            new HttpError("Bad Request", "File too large", 400),
                        );

                        return;
                    }

                    throw error;
                }

                await prisma.$executeRaw(
                    addNewFile(
                        filePath,
                        req.file,
                        result.secure_url,
                        result.public_id,
                        req.user.homeId,
                    ),
                );
            }

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
                (await prisma.$queryRaw(isFolder(path, req.user.homeId)))[0]
                    .folder
            ) {
                next(new HttpError("Bad Request", "Invalid input", 400));

                return;
            }

            const [result] = await prisma.$queryRaw(
                getFiles(arrayToJsonpath(path), req.user.homeId),
            );

            const { items: file } = result;

            const { body } = await fetch(file.$location);

            res.attachment(
                file.$extension
                    ? `${path[path.length - 1]}.${file.$extension}`
                    : path[path.length - 1],
            );

            for await (const chunk of body) {
                res.write(chunk);
            }

            res.end();
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

                await prisma.$transaction(async (tx) => {
                    await unlink(file.$location);

                    await tx.$executeRaw(removeFile(path, req.user.homeId));

                    file.$shareId &&
                        (await tx.share.delete({
                            where: { id: file.$shareId },
                        }));
                });
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

            await prisma.$transaction(async (tx) => {
                const { id } = await tx.share.create({
                    data: {
                        path: `/${path.join("/")}`,
                        expiresAt: date,
                        userId: req.user.id,
                    },
                });

                await tx.$executeRaw(setFileShareId(path, id, req.user.homeId));
            });

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
