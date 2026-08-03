import { DataTypes, Model } from "sequelize";

export class User extends Model { }

export function initializeUserModel(sequelize) {
    User.init(
        {
            user_id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            phone_number: {
                type: DataTypes.STRING(20),
                allowNull: false,
                unique: "uq_user_phone_number",
            },
            password_hash: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: "User",
            tableName: "user",
            createdAt: "created_at",
            updatedAt: "updated_at",
            indexes: [
                {
                    name: "idx_user_phone_number",
                    unique: true,
                    fields: ["phone_number"],
                },
            ],
        }
    )

    return User;
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
export const userVersionInfo = Object.freeze({
    version: "1.0.0",
    description: "Initial Version",
    updated_by: "sonu.ind.dev@gmail.com",
    approved_by: "",
});
