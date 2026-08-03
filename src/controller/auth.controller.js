import { responseType } from "../util/constant.js";
import { catchErrorResponse, catchSuccessResponse } from "../util/common.js";

/**
 * & Route: 
 * ? POST - /api/auth/register
 * & Use:
 * ? To register intial user with basic info but verification pending
 * & Explaination:
 * ? Fetch required info from req & handle validation
 * & Required Updated (if any):
 * ? Handle if user already exist in user table
 * ? Generate random otp and encrypt with jwt key
 * ? Check if user present in user_register table if then update otp & send response 
 * ? Otherwise create new user in user_register table & send response
*/
export const register = (req, res) => {
    try {
        const { phone_number, password } = req.body;

        if (!phone_number || !password) {
            var errorMessage = 'Phone number and Password are required.';
            return res.status(400).json(catchErrorResponse(errorMessage));
        }

        return res.status(200).json(catchSuccessResponse('User created successfully.'));
    } catch (error) {
        var errorMessage = error.message;
        return res.status(500).json(catchErrorResponse(errorMessage));
    }
};
