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
 * ? Step 01: Do the table related code changes
 * ? Step 02: In table model file update it's version info object details properly
 * ? Step 03: Change databaseTableUpdateFlag to true and tablesUpdateFlags of that particular table to true in /src/db/mysql/index.js file
 * ? Step 04: Change databaseTableUpdateFlag to false and tablesUpdateFlags of that particular table to false in /src/db/mysql/index.js file
 * & That's it your table related changes are completed.
 */
export const userVersionInfo = Object.freeze({
    version: "1.1.0",
    description: "Moving user_id from auto increment to UUID",
    updated_by: "sonu.ind.dev@gmail.com",
    approved_by: "",
});
