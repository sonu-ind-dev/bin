import { DataTypes, Model, QueryTypes } from "sequelize";
import { sequelize } from "../../config/database.js";
import config from "../../config/config.js";
import { initializeUserRegisterModel, userRegisterVersionInfo } from "./user_register.model.js";
import { initializeUserModel, userVersionInfo } from "./user.model.js";
import { initializeUserProfileModel, userProfileVersionInfo } from "./user_profile.model.js";


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
export const tableUpdateFlags = Object.freeze({
    user_register: true,
    user: false,
    user_profile: false,
});

// & Export Our Models
export const UserRegister = initializeUserRegisterModel(sequelize);
export const User = initializeUserModel(sequelize);
export const UserProfile = initializeUserProfileModel(sequelize);

export class TableVersionHistory extends Model { }

TableVersionHistory.init(
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
            type: DataTypes.STRING(32),
            allowNull: false,
        },
        description: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        updated_by: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        approved_by: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: "TableVersionHistory",
        tableName: "table_version_history",
        createdAt: "applied_at",
        updatedAt: false,
        indexes: [
            {
                name: "uq_table_version_history_table_version",
                unique: true,
                fields: ["table_name", "version"],
            },
        ],
    },
);


const tableRegistry = [
    {
        tableName: "user_register",
        model: UserRegister,
        versionInfo: { ...userRegisterVersionInfo, approved_by: userRegisterVersionInfo.approved_by.trim().length ? userRegisterVersionInfo.approved_by : config.MYSQL_TABLE_VERSION_APPROVED_BY },
    },
    {
        tableName: "user",
        model: User,
        versionInfo: { ...userVersionInfo, approved_by: userVersionInfo.approved_by.trim().length ? userVersionInfo.approved_by : config.MYSQL_TABLE_VERSION_APPROVED_BY },
    },
    {
        tableName: "user_profile",
        model: UserProfile,
        versionInfo: { ...userProfileVersionInfo, approved_by: userProfileVersionInfo.approved_by.trim().length ? userProfileVersionInfo.approved_by : config.MYSQL_TABLE_VERSION_APPROVED_BY },
    },
];


function validateVersionInfo(tableName, versionInfo) {
    const requiredFields = ["version", "description", "updated_by", "approved_by"];

    for (const field of requiredFields) {
        if (typeof versionInfo?.[field] !== "string" || !versionInfo[field].trim()) {
            throw new Error(`Missing ${field} in version information for ${tableName}.`);
        }
    }
}

async function syncEnabledTableUpdates() {
    for (const table of tableRegistry) {
        if (tableUpdateFlags[table.tableName] !== true) {
            continue;
        }

        table.versionInfo.approved_by = table.versionInfo.approved_by.trim().length ? table.versionInfo.approved_by : config.MYSQL_TABLE_VERSION_APPROVED_BY;

        validateVersionInfo(table.tableName, table.versionInfo);

        const existingVersion = await TableVersionHistory.findOne({
            where: {
                table_name: table.tableName,
                version: table.versionInfo.version,
            },
        });

        if (existingVersion) {
            console.log(
                `ERROR: Table ${table.tableName} model not updated. Table: ${table.tableName} Version: ${table.versionInfo.version} already exists.`
            );
            throw new Error(
                `WARNING: For Table: ${table.tableName} use a New Version or set its tableUpdateFlag to false.`
            );
        }

        // alter: true compares the model with MySQL and applies ALTER TABLE
        // statements for the detected schema differences.
        await table.model.sync({ alter: true });

        await TableVersionHistory.create({
            table_name: table.tableName,
            ...table.versionInfo,
        });

        console.log(
            `SUCCESS: Synchronized Table: ${table.tableName} @Version: ${table.versionInfo.version}`,
        );
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
        // Without alter/force, this creates only missing registered tables.
        await sequelize.sync();
        await syncEnabledTableUpdates();
    } finally {
        await sequelize.query("SELECT RELEASE_LOCK(:lockName)", {
            replacements: { lockName },
            type: QueryTypes.SELECT,
        });
    }
}
