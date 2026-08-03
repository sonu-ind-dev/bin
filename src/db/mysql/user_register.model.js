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

// Add immutable, forward-only migrations here when this existing table changes.
// Example: { version, description, up: async ({ queryInterface }) => { ... } }
export const userRegisterMigrations = [];
