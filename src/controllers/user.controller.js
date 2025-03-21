import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import mongoose, { set } from "mongoose";
import { cookiesOption } from "../constants.js";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;

        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {}
};

const registerUser = asyncHandler(async (req, res) => {
    const { userName, email, password, fullName } = req.body;

    if (
        [userName, email, password, fullName].some(
            (fields) => fields.trim() === ""
        )
    ) {
        throw new apiError(400, "all fields are required");
    }

    const alreadyExist = await User.findOne({
        $or: [{ userName }, { email }],
    });

    if (alreadyExist) {
        throw new apiError(400, "user or email already exist");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (
        req.files &&
        Array.isArray(req.files.coverImage) &&
        req.files.coverImage.length > 0
    ) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new apiError(400, "avatar is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = coverImageLocalPath
        ? await uploadOnCloudinary(coverImageLocalPath)
        : "";

    const avatarUrl = avatar.url || "";
    const coverImageUrl = coverImage.url || "";

    const user = await User.create({
        fullName,
        email,
        password,
        avatar: avatarUrl,
        coverImage: coverImageUrl,
        userName,
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    res.status(201).json(
        new apiResponse(200, "user created successfully", createdUser)
    );
});

const loginUser = asyncHandler(async (req, res) => {
    const { userName, email, password } = req.body;

    if (!userName && !email) {
        throw new apiError(400, "userName or email is required");
    }

    const user = await User.findOne({ $or: [{ userName }, { email }] });

    if (!user) {
        throw new apiError(400, "user not found");
    }

    const correctPassword = await user.isPasswordCorrected(password);

    if (!correctPassword) {
        throw new apiError(400, "password is incorrect");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
        user._id
    );

    const verifiedUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    // console.log(accessToken, refreshToken);

    res.status(200)
        .cookie("accessToken", accessToken, cookiesOption)
        .cookie("refreshToken", refreshToken, cookiesOption)
        .json({ verifiedUser, accessToken, refreshToken });
});

const logoutUser = asyncHandler(async (req, res) => {
    try {
        const user = req.user;

        if (!user) {
            throw new apiError(401, "Unauthorized");
        }

        await User.findByIdAndUpdate(
            user._id,
            {
                $unset: {
                    refreshToken: 1,
                },
            },
            {
                new: true,
            }
        );

        const returnUser = await User.findById(user._id).select(
            "-password -refreshToken"
        );

        return res
            .status(200)
            .clearCookie("accessToken", cookiesOption)
            .clearCookie("refreshToken", cookiesOption)
            .json(
                new apiResponse(200, "user logged out successfully", returnUser)
            );
    } catch (error) {
        throw new apiError(401, error.message || error);
    }
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const token = req.cookies.refreshToken || req.body.refreshToken;

    if (!token) {
        throw new apiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(token, process.env.JWT_REFRESH_TOKEN);

    if (!decodedToken) {
        throw new apiError(401, "Unauthorized request");
    }

    const user = await User.findById(decodedToken._id);

    if (!user) {
        throw new apiError(401, "Unauthorized request");
    }

    // const id = user._id
    // const did = decodedToken._id

    if (token !== user.refreshToken) {
        throw new apiError(401, "token is expired or invalid", {
            decodedToken,
            userId: user.refreshToken,
        });
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
        user._id
    );

    user.refreshToken = refreshToken;
    user.save({ validateBeforeSave: false });

    const returnUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    res.status(200)
        .cookie("accessToken", accessToken, cookiesOption)
        .cookie("refreshToken", refreshToken, cookiesOption)
        .json(
            new apiResponse(200, "token refreshed successfully", {
                accessToken,
                refreshToken,
                returnUser,
                decodedToken,
            })
        );
});

const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const user = req.user;

    if (
        [oldPassword, newPassword, confirmPassword].some(
            (value) => value.trim() === ""
        )
    ) {
        throw new apiError(400, "all fields are required");
    }

    if (newPassword !== confirmPassword) {
        throw new apiError(400, "passwords do not match");
    }

    const checkPassword = await user.isPasswordCorrected(oldPassword);

    if (!checkPassword) {
        throw new apiError(400, "old password is incorrect");
    }

    user.password = newPassword;
    user.save({ validateBeforeSave: false });

    const returnUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    res.status(200).json(
        new apiResponse(200, "password changed successfully", {
            returnUser,
            oldPassword,
            newPassword,
            confirmPassword,
        })
    );
});

const getUser = asyncHandler(async (req, res) => {
    // return await res.status(201).json(200, req.user, "user get successfully");

    const user = await User.findById(req.user).select(
        "-password -refreshToken"
    );

    return res
        .status(200)
        .json(new apiResponse(200, "user get successfully", { user }));
});

const updateUserDetail = asyncHandler(async (req, res) => {
    const { fullName, userName } = req.body;

    const existUserName = await User.findOne({ userName });

    if (existUserName) {
        throw new apiError(400, " user name already exist");
    }

    const user = await User.findByIdAndUpdate(
        req.user,
        {
            $set: {
                fullName,
                userName,
            },
        },
        { new: true }
    ).select("-password -refreshToken");

    return res.status(200).json(
        new apiResponse(200, " User details updated successfully ", {
            user,
        })
    );
});

const avatarUpdate = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new apiError(400, "avatar file not found");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar) {
        throw new apiError(400, "avatar file not found");
    }

    const user = await User.findByIdAndUpdate(req.user, {
        $set: { avatar: avatar.url },
    }).select("-password -refreshToken");

    return res
        .status(200)
        .json(new apiResponse(200, "Avatar updated successfully", user));
});

const coverImageUpdate = asyncHandler(async (req, res) => {
    const coverImagePath = req.file?.path;

    if (!coverImagePath) {
        throw new apiError(404, "cover image not found");
    }

    const coverImage = await uploadOnCloudinary(coverImagePath);

    if (!coverImage) {
        throw new apiError(404, "cover image not found");
    }

    const user = await User.findByIdAndUpdate(
        req.user,
        { $set: { coverImage: coverImage.url } },
        { new: true }
    ).select("-password -refreshToken");

    return res
        .status(200)
        .json(new apiResponse(200, "Cover image updated successfully", user));
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getUser,
    updateUserDetail,
    avatarUpdate,
    coverImageUpdate,
};
