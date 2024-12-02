import { matchedData, validationResult } from "express-validator";
import { validateSignup } from "../lib/validation.js";
import asyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import prisma from "../lib/client.js";

const signup = {
    get(req, res) {
        res.render("signup");
    },
    post: [
        validateSignup(),
        asyncHandler(async (req, res, next) => {
            const error = validationResult(req);

            if (!error.isEmpty()) {
                const errors = error.array({ onlyFirstError: true });

                res.status(400).render("signup", {
                    username: req.body.username,
                    usernameError: errors.find(
                        (value) => value.path === "username",
                    )?.msg,
                    passwordError: errors.find(
                        (value) => value.path === "password",
                    )?.msg,
                    confirmPasswordError: errors.find(
                        (value) => value.path === "confirmPassword",
                    )?.msg,
                });

                return;
            }

            const { username, password } = matchedData(req);

            const user = await prisma.user.create({
                data: {
                    username,
                    passwordHash: await bcrypt.hash(password, 10),
                    home: { create: {} },
                },
            });

            req.login(user, (error) => {
                if (error) {
                    next(error);
                    return;
                }

                res.redirect("/");
            });
        }),
    ],
};

export { signup };
