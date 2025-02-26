import dotenv from "dotenv";
import connectDB from "./db/db.js";
import { app } from "./app.js";
import { PORT } from "./constants.js";

dotenv.config({
    path: "./env",
});

connectDB()
    .then(
        app.listen(PORT, () => {
            console.log(`server is running on port ${PORT}`);
        }),
        app.on("error", (error) => {
            console.log(error);
        })
    )
    .catch((error) => console.log(error));
