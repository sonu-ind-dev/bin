import dotenv from "dotenv";

dotenv.config({ quiet: true });

const {
    APP_PORT,
    MYSQL_TABLE_VERSION_APPROVED_BY,
    MYSQL_DB_NAME, MYSQL_DB_HOST, MYSQL_DB_PORT, MYSQL_DB_USER, MYSQL_DB_PASSWORD,
    JWT_SECRET_KEY,
    PROTECT_VALUE_ENCRYPTION_KEY, PROTECT_VALUE_COMPARISON_KEY,
} = process.env;

const config = {
    APP_PORT,
    MYSQL_TABLE_VERSION_APPROVED_BY,
    MYSQL_DB_NAME, MYSQL_DB_HOST, MYSQL_DB_PORT, MYSQL_DB_USER, MYSQL_DB_PASSWORD,
    JWT_SECRET_KEY,
    PROTECT_VALUE_ENCRYPTION_KEY, PROTECT_VALUE_COMPARISON_KEY,
}

for (const [key, value] of Object.entries(config)) {
    if (!value) {
        throw new Error(`${key} key is not defined in environment variables`);
        break;
    }
}

export default config;