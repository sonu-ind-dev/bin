




import { DataTypes, Model } from "sequelize";

export class UserProfile extends Model { }

export function initializeUserProfileModel(sequelize) {
    UserProfile.init(
        {
            user_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                allowNull: false,
                references: {
                    model: "user",
                    key: "user_id",
                },
            },
            name: {
                type: DataTypes.STRING(255),
                defaultValue: "User",
                allowNull: true,
            },
            dob: {
                type: DataTypes.BIGINT,
                defaultValue: null,
                allowNull: true,
            },
            gender: {
                type: DataTypes.INTEGER, // ? 1 -> Male, 2 -> Female, 3 -> Not Prefer, 4 -> Other
                defaultValue: 0,
                allowNull: true,
            },
            profile_image_url: {
                type: DataTypes.STRING(255),
                defaultValue: null,
                allowNull: true,
            },
            pin_code: {
                type: DataTypes.INTEGER,
                defaultValue: null,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: "UserProfile",
            tableName: "user_profile",
            createdAt: "created_at",
            updatedAt: "updated_at",
            indexes: [
                {
                    name: "idx_user_profile_user_id",
                    unique: false,
                    fields: ["user_id"],
                },
            ],
        }
    )

    return UserProfile;
}

/**
 * & How to update a table
 * ? Step 01: Do the table related code changes
 * ? Step 02: In table model file update it's version info object details properly
 * ? Step 03: Change databaseTableUpdateFlag to true and tablesUpdateFlags of that particular table to true in /src/db/mysql/index.js file
 * ? Step 04: Change databaseTableUpdateFlag to false and tablesUpdateFlags of that particular table to false in /src/db/mysql/index.js file
 * & That's it your table related changes are completed.
 */
export const userProfileVersionInfo = Object.freeze({
    version: "1.1.0",
    description: "Moving Date type columns to BIGINT to store utc number value",
    updated_by: "sonu.ind.dev@gmail.com",
    approved_by: "",
});
