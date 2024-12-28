import { body } from "express-validator";
import prisma from "./client.js";
import { pathToArray } from "./pathUtilities.js";
import { USERNAME_PATTERN, NAME_PATTERN, PATH_PATTERN } from "./constants.js";

function getOneTimeNext(next) {
    let nextCalled = false;

    return (value) => {
        if (!nextCalled) {
            nextCalled = true;
            next(value);
        }
    };
}

function validateSignup() {
    return [
        (req, res, next) => {
            const oneTimeNext = getOneTimeNext(next);

            body("username")
                .trim()
                .notEmpty()
                .withMessage("Can't be empty")
                .matches(USERNAME_PATTERN)
                .withMessage("Contains a forbidden character")
                .bail()
                .custom(async (value) => {
                    let user;

                    try {
                        user = await prisma.user.findUnique({
                            where: { username: value },
                        });
                    } catch (error) {
                        oneTimeNext(error);
                        return;
                    }

                    if (user) {
                        throw new Error("Username is taken");
                    }
                })(req, res, oneTimeNext);
        },
        body("password").notEmpty().withMessage("Can't be empty"),
        body("confirmPassword")
            .notEmpty()
            .withMessage("Can't be empty")
            .custom((value, { req }) => value === req.body.password)
            .withMessage("Passwords don't match"),
    ];
}

function validateLogin() {
    return [
        body("username").notEmpty().withMessage("Can't be empty"),
        body("password").notEmpty().withMessage("Can't be empty"),
    ];
}

function validateNewFile() {
    return [
        body("name")
            .trim()
            .notEmpty()
            .withMessage("Can't be empty")
            .matches(NAME_PATTERN)
            .withMessage("Contains a forbidden character"),
        body("path")
            .notEmpty()
            .withMessage("Path can't be empty")
            .matches(PATH_PATTERN)
            .withMessage("Invalid path")
            .bail()
            .customSanitizer((value) => pathToArray(value)),
    ];
}

export { validateSignup, validateLogin, validateNewFile };
