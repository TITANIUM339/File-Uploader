import asyncHandler from "express-async-handler";
import prisma from "../lib/client.js";
import { arrayToJsonpath, pathToArray } from "../lib/pathUtilities.js";

const home = {
    get: asyncHandler(async (req, res) => {
        const path = pathToArray(req.path);

        const [result] =
            await prisma.$queryRaw`SELECT jsonb_path_query(folder, ${arrayToJsonpath(path)}::jsonpath) AS items FROM "Home" WHERE id = ${req.user.homeId}`;

        const { items } = result;

        const files = Object.keys(items)
            .filter((value) => !value.includes("$"))
            .map((value) => ({
                name: value,
                path: `/home${req.path === "/" ? "" : req.path}/${value}`,
                size: items[value].$size,
                date: items[value].$date,
                iconClassname:
                    items[value].$type === "folder" ? "bi bi-folder" : "",
            }));

        res.render("home", {
            path: req.path,
            breadcrumb: ["home", ...path],
            files,
        });
    }),
};

export { home };
