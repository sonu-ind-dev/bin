import crypto from "node:crypto";
import config from "../config/config.js";
import { responseType } from "./constant.js";
import * as argon2 from "argon2";
import bcrypt from "bcrypt";


// & Response Formats
export const catchSuccessResponse = (successMessage = '', data = null) => ({
    data,
    success: true,
    type: responseType['S'],
    message: successMessage || 'Successful',
});
export const catchErrorResponse = (errorMessage = '', data = null) => ({
    data,
    success: false,
    type: responseType['E'],
    message: errorMessage || 'Request faced internal server error',
});
export const catchWarningResponse = (warningMessage = '', data = null) => ({
    data,
    success: false,
    type: responseType['W'],
    message: warningMessage || 'Due to some warning issue this request failed.',
});


/**
// & Encryption, Hash, Comparision
// & | --------------------- | --------- | ----------- |
// & | Feature               | bcrypt    | Argon2id    |
// & | --------------------- | --------- | ----------- |
// ? | Security              | Very good | Excellent   |
// ? | Speed                 | Faster    | Slower      |
// ? | Memory usage          | Low       | High        |
// ? | GPU attack resistance | Good      | Better      |
// ? | Industry adoption     | Very high | Increasing  |
// ? | OWASP recommendation  | Good      | Preferred   |
// ?
// ? Argon2id → best choice if you can use it.
// ? bcrypt → completely acceptable if you want simplicity and compatibility.
*/
// export const generateHashed = async (value) => await argon2.hash(value, { type: argon2.argon2id });
// export const verifyWithHash = async (enteredValue, hashedValue) => await argon2.verify(hashedValue, enteredValue);

export const generateHashed = async (value) => await bcrypt.hash(value, 12);
export const verifyWithHash = async (enteredValue, hashedValue) => await bcrypt.compare(enteredValue, hashedValue);

export const protectValue = (value) => {
    if (typeof value !== "string") throw new TypeError("value must be a string to protect.");

    const encryptionKey = Buffer.from(config.PROTECT_VALUE_ENCRYPTION_KEY, "base64");
    const comparisonKey = Buffer.from(config.PROTECT_VALUE_COMPARISON_KEY, "base64");

    if (encryptionKey.length !== 32 || comparisonKey.length !== 32) throw new Error('ENCRYPTION_KEY & COMPARISON_KEY must be decode to exactly 32 bytes.');

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey, iv);
    const encryptedValue = Buffer.concat([
        cipher.update(value, "utf8"),
        cipher.final(),
    ]);

    return {
        encryptedValue: encryptedValue.toString("base64url"),
        iv: iv.toString("base64url"),
        authTag: cipher.getAuthTag().toString("base64url"),
        equalityTag: crypto
            .createHmac("sha256", comparisonKey)
            .update(value, "utf8")
            .digest("base64url"),
    };
};


// ? Generate Hash OTP
export const generateHashedOtp = async () => {
    const otp = Math.floor(100000 + Math.random() * 900000);
    const hashedOtp = await generateHashed(String(otp));

    return hashedOtp;
}