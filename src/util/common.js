import crypto from "node:crypto";
import config from "../config/config.js";
import { responseType } from "./constant.js";
import argon2 from "argon2id/lib/setup.js";


export const catchSuccessResponse = (successMessage = '') => ({
    success: true,
    type: responseType['S'],
    message: successMessage || 'Successful',
});
export const catchErrorResponse = (errorMessage = '') => ({
    success: false,
    type: responseType['E'],
    message: errorMessage || 'Request faced internal server error',
});


export const createHash = async (value) => await argon2.hash(value, { type: argon2.argon2id });
export const verifyToHash = async (enteredValue, hashedValue) => await argon2.verify(hashedValue, enteredValue);

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