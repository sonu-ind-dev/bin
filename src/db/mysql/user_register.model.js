import { DataTypes, Model } from "sequelize";

export class UserRegister extends Model { }

export function initializeUserRegisterModel(sequelize) {
    UserRegister.init(
        {
            register_id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            phone_number: {
                type: DataTypes.STRING(20),
                allowNull: false,
                unique: "uq_user_register_phone_number",
            },
            password_hash: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            otp_hash: {
                type: DataTypes.STRING(255),
                defaultValue: null,
                allowNull: true,
            },
            otp_expires_at: {
                type: DataTypes.BIGINT,
                defaultValue: null,
                allowNull: true,
            },
            submission_count: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
                allowNull: true,
            },
            submission_blocked: { // After 5 times submission we block user for 5 minutes
                type: DataTypes.BIGINT,
                defaultValue: null,
                allowNull: true,
            },
            verify_count: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
                allowNull: true,
            },
            verify_blocked: { // After 5 times otp verify we block user for 1 minute
                type: DataTypes.BIGINT,
                defaultValue: null,
                allowNull: true,
            }
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
 * ? Step 01: Do the table related code changes
 * ? Step 02: In table model file update it's version info object details properly
 * ? Step 03: Change databaseTableUpdateFlag to true and tablesUpdateFlags of that particular table to true in /src/db/mysql/index.js file
 * ? Step 04: Change databaseTableUpdateFlag to false and tablesUpdateFlags of that particular table to false in /src/db/mysql/index.js file
 * & That's it your table related changes are completed.
 */
export const userRegisterVersionInfo = Object.freeze({
    version: "1.2.1",
    description: "Adding columns to track otp verification submission counts & handle accordingly",
    updated_by: "sonu.ind.dev@gmail.com",
    approved_by: "",
});
