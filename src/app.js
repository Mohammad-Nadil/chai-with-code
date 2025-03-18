import express from "express";
import cors from "cors";
import { CORS } from "./constants.js";
import multer from "multer";
import cookieParser from "cookie-parser";

const app = express();
const upload = multer()

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser())
app.use(
    cors({
        origin: CORS,
        credentials: true,
    })
);

// routes
import userRoutes from "./routes/user.routes.js"

app.use("/api/users", userRoutes )



export {app}
