import mongoose from "mongoose";
import bcrypt from "bcrypt";
import {
    JWT_ACCESS_EXPIRY,
    JWT_ACCESS_TOKEN,
    JWT_REFRESH_EXPIRY,
    JWT_REFRESH_TOKEN,
    JWT_REFRESH_TOKEN_EXPIRES_IN,
} from "../constants";

const userSchema = new mongoose.Schema(
    {
        watchHistory: [
            {
                type: schema.Types.ObjectId,
                ref: "Video",
            },
        ],
        userName: {
            type: String,
            required: true,
            unique: true,
            index: true,
            lowercase: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        fullName: {
            type: String,
            required: true,
        },
        avatar: {
            type: String,
        },
        coverImage: {
            type: String,
        },
        password: {
            type: String,
            required: true,
        },
        refreshToken: {
            type: String,
        },
    },
    { timestamps: true }
);

userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 8);
    } else next();
});

userSchema.methods.isPasswordCorrected = async function (password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        { _id: this._id, userName: this.userName },
        JWT_ACCESS_TOKEN,
        { JWT_ACCESS_EXPIRY }
    );
};
userSchema.methods.generateAccessToken = function () {
    return jwt.sign({ _id: this._id }, JWT_REFRESH_TOKEN, {
        JWT_REFRESH_EXPIRY,
    });
};

export const User = mongoose.model("User", userSchema);

// PS C:\Users\user\OneDrive\Desktop\chai with code> npm i mongoose-aggregate-paginate-v2
// npm error code ETIMEDOUT
// npm error errno ETIMEDOUT
// npm error network request to https://registry.npmjs.org/mongoose-aggregate-paginate-v2 failed, reason:
// npm error network This is a problem related to network connectivity.
// npm error network In most cases you are behind a proxy or have bad network settings.
// npm error network
// npm error network If you are behind a proxy, please make sure that the
// npm error network 'proxy' config is set properly.  See: 'npm help config'
// npm error A complete log of this run can be found in: C:\Users\user\AppData\Local\npm-cache\_logs\2025-02-27T09_13_44_752Z-debug-0.log
// PS C:\Users\user\OneDrive\Desktop\chai with code> 