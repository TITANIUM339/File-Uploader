import asyncHandler from "express-async-handler";
import { pathToArray, arrayToJsonpath } from "../lib/pathUtilities.js";
import getIconClassname from "../lib/getIconClassname.js";
import { getFiles } from "../lib/queries.js";
import prisma from "../lib/client.js";

const folder = {
    get: asyncHandler(async (req, res) => {
        const path = [
            ...pathToArray(res.locals.sharePath),
            ...pathToArray(req.path).slice(1),
        ];

        const [result] = await prisma.$queryRaw(
            getFiles(arrayToJsonpath(path), res.locals.homeId),
        );

        const { items } = result;

        const files = [];
        const folders = [];

        Object.keys(items)
            .filter((value) => !value.includes("$"))
            .forEach((value) => {
                const path = `/share${req.path === "/" ? "" : req.path}/${value}`;
                const date = items[value].$date;

                if (items[value].$type === "file") {
                    files.push({
                        path,
                        date,
                        name: value,
                        size: items[value].$size,
                        iconClassname: getIconClassname(
                            items[value].$extension,
                        ),
                    });
                } else {
                    folders.push({
                        path,
                        date,
                        name: value,
                        iconClassname: "bi bi-folder",
                    });
                }
            });

        res.render("folder", {
            restricted: true,
            breadcrumb: pathToArray(req.path).slice(1),
            root: `/share/${res.locals.shareId}`,
            files: [...folders, ...files],
        });
    }),
};

export { folder };
