import { DataTypes, Model } from "sequelize";

export class UserRegister extends Model { }

export function initializeUserRegisterModel(sequelize) {
    UserRegister.init(
        {
            phone_number: {
                type: DataTypes.STRING(20),
                primaryKey: true,
                allowNull: false,
                unique: "uq_user_register_phone_number",
            },
            password_hash: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            otp_hash: { type: DataTypes.STRING(255) },
            otp_expires_at: { type: DataTypes.DATE },
            submission_count: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
                allowNull: true,
            },
            submission_blocked: {
                type: DataTypes.DATE,
                defaultValue: null,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: "UserRegister",
            tableName: "user_register",
            createdAt: "created_at",
            updatedAt: "updated_at",
            indexes: [
                {
                    name: "idx_user_register_verification",
                    fields: ["otp_expires_at"],
                },
            ],
        },
    );

    return UserRegister;
}

/**
 * & How to update a table
 * ? Step 01: Stop the server then do the table related code changes
 * ? Step 02: In table model file update it's version info object details properly
 * ? Step 03: Change tableUpdateFlags of that particular table to true in /src/db/mysql/index.js file
 * ? Step 04: Start the server
 * ? Step 05: Stop the server
 * ? Step 06: Only change tableUpdateFlags of that particular table to false in /src/db/mysql/index.js file
 * & That's it your table related changes are completed.
 */
export const userRegisterVersionInfo = Object.freeze({
    version: "1.0.0",
    description: "Initial Version",
    updated_by: "sonu.ind.dev@gmail.com",
    approved_by: "",
});
