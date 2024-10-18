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

const PORT = process.env.PORT || 80;

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(import.meta.dirname, "views"));

app.use(helmet());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.resolve("public")));

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

            if (!user && !(await bcrypt.compare(password, user.passwordHash))) {
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

app.listen(PORT, () => console.log(`Serving on: http://localhost:${PORT}`));
