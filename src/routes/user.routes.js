import { Router } from "express";
import {
    loginUser,
    registerUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getUser,
    updateUserDetail,
    avatarUpdate,
    coverImageUpdate,
} from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJwt } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 },
    ]),
    registerUser
);

router.route("/login").post(upload.none(), loginUser);

// secured routes
router.route("/logout").post(verifyJwt, logoutUser);
router.route("/refreshToken").post(refreshAccessToken);
router.route("/changePassword").post(upload.none(), verifyJwt, changePassword);
router.route("/getUser").post(upload.none(), verifyJwt, getUser);
router.route("/updateUser").post(upload.none(), verifyJwt, updateUserDetail);
router
    .route("/updateAvatar")
    .post(upload.single("avatar"), verifyJwt, avatarUpdate);
router
    .route("/updateCoverImage")
    .post(upload.single("coverImage"), verifyJwt, coverImageUpdate);

export default router;
