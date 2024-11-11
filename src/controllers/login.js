import { validateLogin } from "../lib/validation.js";
import { validationResult } from "express-validator";
import passport from "passport";

const login = {
    get(req, res) {
        res.render("login");
    },
    post: [
        validateLogin(),
        (req, res, next) => {
            const error = validationResult(req);

            if (!error.isEmpty()) {
                const errors = error.array({ onlyFirstError: true });

                res.status(400).render("login", {
                    username: req.body.username,
                    usernameError: errors.find(
                        (value) => value.path === "username",
                    )?.msg,
                    passwordError: errors.find(
                        (value) => value.path === "password",
                    )?.msg,
                });

                return;
            }

            passport.authenticate("local", (err, user, info) => {
                if (err) {
                    next(err);
                    return;
                }

                if (!user) {
                    res.status(400).render("login", {
                        username: req.body.username,
                        usernameError: info.message,
                        passwordError: info.message,
                    });

                    return;
                }

                req.login(user, (err) => {
                    if (err) {
                        next(err);
                        return;
                    }

                    res.redirect("/");
                });
            })(req);
        },
    ],
};

export { login };
