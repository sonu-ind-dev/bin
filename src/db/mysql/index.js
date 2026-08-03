import { DataTypes, Model, QueryTypes } from "sequelize";
import { sequelize } from "../../config/database.js";
import {
    initializeUserRegisterModel,
    userRegisterMigrations,
} from "./user_register.model.js";

class SchemaMigration extends Model {}

SchemaMigration.init(
    {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true,
        },
        table_name: {
            type: DataTypes.STRING(64),
            allowNull: false,
        },
        version: {
            type: DataTypes.STRING(128),
            allowNull: false,
        },
        description: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: "SchemaMigration",
        tableName: "schema_migrations",
        createdAt: "applied_at",
        updatedAt: false,
        indexes: [
            {
                name: "uq_schema_migrations_table_version",
                unique: true,
                fields: ["table_name", "version"],
            },
        ],
    },
);

const UserRegister = initializeUserRegisterModel(sequelize);

export const models = { UserRegister, SchemaMigration };

// Explicit opt-in: leave false during ordinary application starts.
export const tableUpdateFlags = Object.freeze({
    user_register: false,
});

const modelMigrations = [
    {
        tableName: "user_register",
        migrations: userRegisterMigrations,
    },
];

async function applyEnabledMigrations() {
    const queryInterface = sequelize.getQueryInterface();

    for (const model of modelMigrations) {
        if (tableUpdateFlags[model.tableName] !== true) {
            continue;
        }

        for (const migration of model.migrations) {
            const alreadyApplied = await SchemaMigration.findOne({
                where: { table_name: model.tableName, version: migration.version },
            });

            if (alreadyApplied) {
                continue;
            }

            await migration.up({ queryInterface, sequelize, models });
            await SchemaMigration.create({
                table_name: model.tableName,
                version: migration.version,
                description: migration.description,
            });
            console.log(`Applied MySQL migration: ${model.tableName}/${migration.version}`);
        }
    }
}

/** Run before the HTTP server accepts requests. */
export async function initializeMysqlModels() {
    const lockName = "bin_mysql_schema_initialization";
    const [lock] = await sequelize.query(
        "SELECT GET_LOCK(:lockName, 30) AS acquired",
        { replacements: { lockName }, type: QueryTypes.SELECT },
    );

    if (Number(lock.acquired) !== 1) {
        throw new Error("Could not acquire the MySQL schema initialization lock.");
    }

    try {
        // sync() without alter/force creates only tables that do not exist.
        await sequelize.sync();
        await applyEnabledMigrations();
    } finally {
        await sequelize.query("SELECT RELEASE_LOCK(:lockName)", {
            replacements: { lockName },
            type: QueryTypes.SELECT,
        });
    }
}
