import { apiError } from "../utils/apiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"
import {User} from "../models/user.model.js"

export const verifyJwt = asyncHandler(async (req , _ , next) =>{
    
    try {
        const token = req.cookies.accessToken || req.headers["authorization"]?.replace("Bearer " , "")
    
        if(!token){
           throw new apiError(401 , "Unauthorized")
        }
    
       const decodedToken = jwt.verify(token , process.env.JWT_ACCESS_TOKEN )
    
       const user = await User.findById(decodedToken._id).select(" -refreshToken")
    
       if(!user){
        throw new apiError(401 , "Unauthorized")
       }
    
       req.user = user
    
       next()
    } catch (error) {
        throw new apiError(401 , error.message || error )
    }


})