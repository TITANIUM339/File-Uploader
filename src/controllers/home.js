import isAuthenticated from "../lib/isAuthenticated.js";

const home = {
    get: [
        isAuthenticated,
        (req, res) => {
            res.render("home", {
                path: [
                    "home",
                    ...req.path.split("/").filter((value) => value !== ""),
                ],
            });
        },
    ],
};

export { home };
