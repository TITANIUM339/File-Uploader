import { Prisma } from "@prisma/client";
import { UTCDate } from "@date-fns/utc";
import { arrayToJsonpath } from "./pathUtilities.js";

const addFile = `UPDATE "Home" SET folder = jsonb_insert(folder, $1::text[], $2::jsonb) WHERE id = $3`;
const fileDoesNotAlreadyExist = `AND NOT jsonb_path_exists(folder, $4::jsonpath)`;
const pathIsFolder = `AND COALESCE(folder #>> $5::text[], 'folder') = 'folder'`;

function pathExists(jsonpath, id) {
    return Prisma.sql`SELECT jsonb_path_exists(folder, ${jsonpath}::jsonpath) AS exists FROM "Home" WHERE id = ${id}`;
}

function addNewFile(arrayFilePath, file, id) {
    const newFile = {
        $type: "file",
        $mimeType: file.mimetype,
        $size: file.size,
        $location: file.path,
        $extension:
            /^.+\.([A-Za-z0-9]+)$/.exec(file.originalname)?.[1].toLowerCase() ||
            null,
        $date: new UTCDate(),
    };

    const query = Prisma.raw(
        `${addFile} ${fileDoesNotAlreadyExist} ${pathIsFolder}`,
    );

    query.values = [
        arrayFilePath,
        newFile,
        id,
        arrayToJsonpath(arrayFilePath),
        [...arrayFilePath.slice(0, arrayFilePath.length - 1), "$type"],
    ];

    return query;
}

function addNewFolder(arrayFolderPath, id) {
    const newFolder = {
        $type: "folder",
        $date: new UTCDate(),
    };

    const query = Prisma.raw(
        `${addFile} ${fileDoesNotAlreadyExist} ${pathIsFolder}`,
    );

    query.values = [
        arrayFolderPath,
        newFolder,
        id,
        arrayToJsonpath(arrayFolderPath),
        [...arrayFolderPath.slice(0, arrayFolderPath.length - 1), "$type"],
    ];

    return query;
}

function getFiles(jsonpath, id) {
    return Prisma.sql`SELECT jsonb_path_query(folder, ${jsonpath}::jsonpath) AS items FROM "Home" WHERE id = ${id}`;
}

function isFolder(arrayPath, id) {
    return Prisma.sql`SELECT COALESCE(folder #>> ${[...arrayPath, "$type"]}::text[], 'folder') = 'folder' AS folder FROM "Home" WHERE id = ${id}`;
}

function removeFile(arrayFilePath, id) {
    return Prisma.sql`UPDATE "Home" SET folder = folder #- ${arrayFilePath}::text[] WHERE id = ${id}`;
}

function renameFile(arrayFilePath, newName, id) {
    const renameFile = `UPDATE "Home" SET folder = jsonb_insert(folder #- $1::text[], $2::text[], folder #> $1::text[]) WHERE id = $3`;
    const fileExists = `AND jsonb_path_exists(folder, $5::jsonpath)`;
    const isFileOrFolder = `AND folder #>> $6::text[] IN ('folder', 'file')`;

    const newFilePath = [
        ...arrayFilePath.slice(0, arrayFilePath.length - 1),
        newName,
    ];

    const query = Prisma.raw(
        `${renameFile} ${fileDoesNotAlreadyExist} ${fileExists} ${isFileOrFolder}`,
    );

    query.values = [
        arrayFilePath,
        newFilePath,
        id,
        arrayToJsonpath(newFilePath),
        arrayToJsonpath(arrayFilePath),
        [...arrayFilePath, "$type"],
    ];

    return query;
}

export {
    pathExists,
    addNewFile,
    addNewFolder,
    getFiles,
    isFolder,
    removeFile,
    renameFile,
};
