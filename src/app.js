import express from "express";
import cors from "cors";
import { CORS } from "./constants";

const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(
    cors({
        origin: CORS,
        credentials: true,
    })
);
