import asyncHandler from "express-async-handler";
import isAuthenticated from "../lib/isAuthenticated.js";
import prisma from "../lib/client.js";

const home = {
    get: [
        isAuthenticated,
        asyncHandler(async (req, res) => {
            const path = req.path.split("/").filter((value) => value !== "");

            const [result] =
                await prisma.$queryRaw`SELECT jsonb_path_query(folder, ${path.length ? `$."${path.join('"."')}"` : "$"}::jsonpath) AS items FROM "Home" WHERE id = ${req.user.homeId}`;

            const { items } = result;

            const files = Object.keys(items)
                .filter((value) => !value.includes("$"))
                .map((value) => ({
                    name: value,
                    path: `/home${req.path === "/" ? "" : req.path}/${value}`,
                    size: items[value].$size,
                    date: items[value].$date,
                    iconClassname: items[value].$size ? "" : "bi bi-folder",
                }));

            res.render("home", {
                path: req.path,
                breadcrumb: [
                    "home",
                    ...req.path.split("/").filter((value) => value !== ""),
                ],
                files,
            });
        }),
    ],
};

export { home };
