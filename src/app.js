import "dotenv/config";
import express from "express";
import helmet from "helmet";
import path from "path";

const PORT = process.env.PORT || 80;

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(import.meta.dirname, "views"));

app.use(helmet());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.resolve("public")));

app.listen(PORT, () => console.log(`Serving on: http://localhost:${PORT}`));
