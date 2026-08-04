import { responseType } from "../util/constant.js";
import { catchErrorResponse, catchSuccessResponse, generateHashed, generateHashedOtp } from "../util/common.js";
import { User, UserRegister } from "../db/mysql/index.js";
import { raw } from "mysql2";
import moment from "moment";



/**
 * & Route: 
 * ? POST - /api/auth/register
 * & Use:
 * ? To register intial user with basic info but verification pending
 * & Explaination:
 * ? Fetch required info from req & handle validation
 * ? Handle if user already exist in user table
 * ? Handle if user already exist in registeration table then fetch and update otherwise create
 * ? Handle if user is trying multiple times or blocked or un-blocked
 * ? Generate password hash, otp hash and otp_expiry then update or create and send data
 * & Required Updated (if any):
 * ? Send otp on shared mobile number with password info also
 * ? If any uer got blocked due to multiple submissions then will send notification after block time
*/
export const register = async (req, res) => {
    try {
        // ? Fetch required info from req & handle validation
        const { phone_number, password } = req.body;

        if (!phone_number || !password) {
            let errorMessage = 'Phone number and Password are required.';
            return res.status(400).json(catchErrorResponse(errorMessage));
        }

        // ? Handle if user already exist in user table
        const user = await User.findOne({
            where: { phone_number },
            attributes: ['user_id'],
            raw: true,
        });
        if (user?.user_id) {
            let errorMessage = 'Failed to register. Please check provided info & try again!';
            return res.status(409).json(catchErrorResponse(errorMessage));
        }

        // ? Handle if user already exist in user_registeration table then fetch otherwise create
        const [user_register, created] = await UserRegister.findOrCreate({
            where: { phone_number },
            defaults: { password_hash: '' }
        });

        const now = moment.utc().valueOf();
        const after_five_minutes = moment.utc().add(5, "minutes").valueOf();

        // ? Handle if user is trying multiple times or blocked or un-blocked
        if (user_register?.submission_blocked) {
            if (user_register?.submission_blocked > now) {
                let errorMessage = `Due to multiple attempts, We blocked your registration request for 5 minutes. After that you can try again!`;
                return res.status(429).json(catchErrorResponse(errorMessage));
            } else {
                user_register.submission_blocked = null;
                user_register.submission_count = 0;
            }
        }

        user_register.submission_count = (user_register?.submission_count ?? 0) + 1;

        if (user_register.submission_count >= 5) {
            user_register.submission_blocked = after_five_minutes;
            // Will procceed this request but have blocked coming upcoming requests
        }

        // ? Generate password hash, otp hash and otp_expiry then update table data
        const password_hash = await generateHashed(password);
        const otp_hash = await generateHashedOtp();
        const otp_expires_at = after_five_minutes;

        user_register.otp_hash = otp_hash;
        user_register.password_hash = password_hash;
        user_register.otp_expires_at = otp_expires_at;

        await user_register.save();

        const data = { phone_number: user_register.phone_number, otp_expires_at: user_register.otp_expires_at }

        return res.status(200).json(catchSuccessResponse('User registered successfully.', data));
    } catch (error) {
        let errorMessage = error.message;
        console.log(`ERROR: ${req.method} ${req.baseUrl}${req.path} - Error: ${error}`);
        return res.status(500).json(catchErrorResponse(errorMessage));
    }
};
