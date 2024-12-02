import isAuthenticated from "../lib/isAuthenticated.js";

const home = {
    get: [
        isAuthenticated,
        (req, res) => {
            res.render("home", { path: req.path });
        },
    ],
};

export { home };
