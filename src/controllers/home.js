import asyncHandler from "express-async-handler";
import prisma from "../lib/client.js";
import { arrayToJsonpath, pathToArray } from "../lib/pathUtilities.js";
import { NAME_PATTERN } from "../lib/constants.js";
import getIconClassname from "../lib/getIconClassname.js";

const home = {
    get: asyncHandler(async (req, res) => {
        const path = pathToArray(req.path);

        const [result] =
            await prisma.$queryRaw`SELECT jsonb_path_query(folder, ${arrayToJsonpath(path)}::jsonpath) AS items FROM "Home" WHERE id = ${req.user.homeId}`;

        const { items } = result;

        const files = [];
        const folders = [];

        Object.keys(items)
            .filter((value) => !value.includes("$"))
            .forEach((value) => {
                const path = `/home${req.path === "/" ? "" : req.path}/${value}`;
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

        res.render("home", {
            path: req.path,
            breadcrumb: ["home", ...path],
            files: [...folders, ...files],
            namePattern: NAME_PATTERN.source,
        });
    }),
};

export { home };
