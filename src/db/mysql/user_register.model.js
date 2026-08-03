import { DataTypes, Model } from "sequelize";

export class UserRegister extends Model {}

export function initializeUserRegisterModel(sequelize) {
    UserRegister.init(
        {
            id: {
                type: DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
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
            otp_hash: DataTypes.STRING(255),
            otp_expires_at: DataTypes.DATE,
            is_verified: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
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
                    fields: ["is_verified", "otp_expires_at"],
                },
            ],
        },
    );

    return UserRegister;
}

// Add immutable, forward-only migrations here when this existing table changes.
// Example: { version, description, up: async ({ queryInterface }) => { ... } }
export const userRegisterMigrations = [];
