import "dotenv/config";
import express from "express";
import helmet from "helmet";
import path from "path";
import session from "express-session";
import { PrismaSessionStore } from "@quixo3/prisma-session-store";
import prisma from "./lib/client.js";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import indexRouter from "./routes/index.js";
import signupRouter from "./routes/signup.js";
import loginRouter from "./routes/login.js";
import logoutRouter from "./routes/logout.js";
import HttpError from "./lib/HttpError.js";
import homeRouter from "./routes/home.js";
import folderRouter from "./routes/folder.js";
import fileRouter from "./routes/file.js";
import shareRouter from "./routes/share.js";
import { UTCDate } from "@date-fns/utc";
import { removeFileShareId } from "./lib/queries.js";
import { pathToArray } from "./lib/pathUtilities.js";

const PORT = process.env.PORT || 80;

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(import.meta.dirname, "views"));

app.use(helmet());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.resolve("public")));

setInterval(
    async () => {
        const now = new UTCDate();

        try {
            const shares = await prisma.share.findMany({
                where: { expiresAt: { lte: now } },
                include: { user: true },
            });

            if (!shares.length) {
                return;
            }

            await prisma.$transaction(async (tx) => {
                for (const share of shares) {
                    await tx.$executeRaw(
                        removeFileShareId(
                            pathToArray(share.path),
                            share.user.homeId,
                        ),
                    );
                }

                await tx.share.deleteMany({
                    where: { expiresAt: { lte: now } },
                });
            });
        } catch (error) {
            console.error(error);
        }
    },
    // 2 minutes
    2 * 60 * 1000,
);

app.use(
    session({
        resave: false,
        saveUninitialized: false,
        secret: process.env.COOKIE_SECRET,
        store: new PrismaSessionStore(prisma, {
            // 2 minutes
            checkPeriod: 2 * 60 * 1000,
        }),
    }),
);
passport.use(
    new LocalStrategy(async (username, password, done) => {
        try {
            const user = await prisma.user.findUnique({
                where: { username },
            });

            if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
                done(null, false, { message: "Invalid username or password" });
                return;
            }

            done(null, user);
        } catch (error) {
            done(error);
        }
    }),
);
passport.serializeUser((user, done) => {
    done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
    try {
        done(null, await prisma.user.findUnique({ where: { id } }));
    } catch (error) {
        done(error);
    }
});
app.use(passport.session());

app.use((req, res, next) => {
    res.locals.user = req.user || null;
    next();
});
app.use((req, res, next) => {
    res.locals.year = new Date().getFullYear();
    next();
});
app.use((req, res, next) => {
    try {
        decodeURIComponent(req.url);
        next();
    } catch {
        next(
            new HttpError("Bad Request", "You've entered a malformed URL", 400),
        );
    }
});

app.use("/", indexRouter);
app.use("/sign-up", signupRouter);
app.use("/log-in", loginRouter);
app.use("/log-out", logoutRouter);
app.use("/home", homeRouter);
app.use("/folder", folderRouter);
app.use("/file", fileRouter);
app.use("/share", shareRouter);

app.use((req, res, next) =>
    next(
        new HttpError(
            "Not Found",
            "The page you were looking for doesn't exist",
            404,
        ),
    ),
);
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    if (err.statusCode) {
        res.status(err.statusCode).render("error", { error: err });
    } else {
        console.error(err);

        const error = new HttpError(
            "Internal Server Error",
            "An unexpected error has occurred",
            500,
        );

        res.status(error.statusCode).render("error", { error });
    }
});

app.listen(PORT, () => console.log(`Serving on: http://localhost:${PORT}`));
