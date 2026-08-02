import { responseType } from "../util/constant.js";
import { catchErrorResponse, catchSuccessResponse } from "../util/common.js";

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
