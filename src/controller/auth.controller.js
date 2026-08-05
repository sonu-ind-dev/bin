import { responseType } from "../util/constant.js";
import { catchSuccessResponse, catchWarningResponse, catchErrorResponse, generateHashed, verifyWithHash, generateHashedOtp } from "../util/common.js";
import { User, UserProfile, UserRegister } from "../db/mysql/index.js";
import { raw } from "mysql2";
import moment from "moment";



/**
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
/**
 * @route POST /api/auth/register
 * @param {Number} phone_number To register the new user
 * @param {String} password To protect user account accessibility 
 * @description To register intial user with basic info but verification pending
 */
export const register = async (req, res) => {
    let errorMessage = '';
    try {
        // ? Fetch required info from req & handle validation
        const phone_number = Number(req.body.phone_number);
        const password = String(req.body.password ?? '');

        if (!phone_number || !password) {
            errorMessage = 'Phone number and Password are required.';
            return res.status(400).json(catchErrorResponse(errorMessage));
        }

        // ? Handle if user already exist in user table
        const user = await User.findOne({
            where: { phone_number },
            attributes: ['user_id'],
            raw: true,
        });
        if (user?.user_id) {
            errorMessage = 'Failed to register. Please check provided info & try again!';
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
                errorMessage = `Due to multiple attempts, We have blocked your registration request for 5 minutes. After that you can try again!`;
                return res.status(429).json(catchWarningResponse(errorMessage));
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
        errorMessage = error.message;
        console.log(`ERROR: ${req.method} ${req.baseUrl}${req.path} - Error: ${error}`);
        return res.status(500).json(catchErrorResponse(errorMessage));
    }
};



/**
 * & Explaination:
 * ? Fetch otp from req & handle validation
 * ? Handle if user is requested for registeration & haven't verified
 * ? Generate hashed value of req otp & verify with our db otp_hash value
 * ? Handle wrong otp submission After 5 wrong submission we will generate & send new otp to user & block verification for 1 minute
 * ? Handle correct otp then we will move user_register to user table and remove from user_register table
 */
/**
 * 
 * @route POST /api/auth/verify-otp
 * @param {Number} phone_number To verify phone number
 * @param {Number} otp Entered otp by user 
 * @description User phone number verification
 */
export const verifyOtp = async (req, res) => {
    let errorMessage = '';
    try {
        // ? Fetch otp from req & handle validation
        const phone_number = Number(req.body.phone_number);
        const otp = String(req.body.otp ?? '');


        if (!phone_number || !otp) {
            errorMessage = 'Phone number and OTP are required.'
            return res.status(400).json(catchErrorResponse(errorMessage));
        }

        // Fetch registration request as a model instance (not raw) so we can update and save
        let user_register = await UserRegister.findOne({
            where: { phone_number },
            attributes: ['register_id', 'phone_number', 'password_hash', 'otp_hash', 'verify_count', 'verify_blocked', 'otp_expires_at']
        });

        if (!user_register) {
            errorMessage = `No registration request found for phone number: ${phone_number}`;
            return res.status(404).json(catchErrorResponse(errorMessage));
        }

        const now = moment.utc().valueOf();

        // If verification is currently blocked
        if (user_register.verify_blocked && user_register.verify_blocked >= now) {
            errorMessage = 'Verification temporarily blocked due to multiple failed attempts. Please try again later.';
            return res.status(429).json(catchWarningResponse(errorMessage));
        }

        // If OTP expired
        if (user_register.otp_expires_at && user_register.otp_expires_at < now) {
            errorMessage = 'OTP has expired. Please request a new OTP.';
            return res.status(400).json(catchWarningResponse(errorMessage));
        }

        // If user already exists in main user table
        const user_exist = await User.findOne({ where: { phone_number }, attributes: ['user_id'] });
        if (user_exist) {
            errorMessage = 'User is already verified.';
            return res.status(409).json(catchWarningResponse(errorMessage));
        }

        const is_verified = await verifyWithHash(otp, user_register.otp_hash);

        if (is_verified) {
            const user = await User.create({ phone_number: user_register.phone_number, password_hash: user_register.password_hash });

            if (user) {
                // Create user profile & Delete registration request
                const user_profile = await UserProfile.create({ user_id: user.user_id });
                await UserRegister.destroy({ where: { register_id: user_register.register_id } });

                const responseUser = {
                    user: { user_id: user.user_id, phone_number: user.phone_number },
                    user_profile: user_profile,
                }
                return res.status(201).json(catchSuccessResponse('User verified and created successfully.', responseUser));
            }

            errorMessage = 'Failed to create user.';
            return res.status(500).json(catchErrorResponse(errorMessage));
        }

        // OTP not verified: increment verify_count and possibly block
        user_register.verify_count = (user_register.verify_count ?? 0) + 1;

        if (user_register.verify_count >= 5) {
            user_register.verify_blocked = moment.utc().add(1, 'minutes').valueOf();
            user_register.verify_count = 0;
            user_register.otp_hash = await generateHashedOtp();
            await user_register.save();

            errorMessage = 'Too many incorrect OTP attempts. A new OTP has been sent and verification is blocked for 1 minute.';
            return res.status(429).json(catchErrorResponse(errorMessage));
        }

        await user_register.save();
        const attemptsLeft = 5 - (user_register.verify_count ?? 0);

        errorMessage = `OTP verification failed. ${attemptsLeft} attempt(s) remaining.`;
        return res.status(400).json(catchErrorResponse(errorMessage));
    } catch (error) {
        errorMessage = error.message;
        console.log(`ERROR: ${req.method} ${req.baseUrl}${req.path} - Error: ${error}`);
        return res.status(500).json(catchErrorResponse(errorMessage));
    }
}