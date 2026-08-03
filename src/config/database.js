import mysql from "mysql2/promise";
import config from "./config.js";

const mysql_db_connection = async () => {
    var mysql_connection;

    try {
        // ? Explore mysql.createPool - Todo
        mysql_connection = await mysql.createConnection({
            host: config.MYSQL_DB_HOST,
            user: config.MYSQL_DB_USER,
            password: config.MYSQL_DB_PASSWORD,
        });

        console.log("Connected to MySQL server");

        const db_query = "SHOW DATABASES LIKE ?";
        const [databases] = await mysql_connection.query(db_query, [config.MYSQL_DB_NAME]);

        if (databases.length === 0) {
            console.log(`Database ${config.MYSQL_DB_NAME} not found.`);

            await mysql_connection.query(`CREATE DATABASE \`${config.MYSQL_DB_NAME}\``);

            console.log(`Database ${config.MYSQL_DB_NAME} created successfully.`);
        } else {
            console.log(`Database ${config.MYSQL_DB_NAME} already exist.`);
        }

        if (mysql_connection) await mysql_connection.destroy();

        // ? Explore mysql.createPool - Todo
        const connection_db = await mysql.createConnection({
            host: config.MYSQL_DB_HOST,
            user: config.MYSQL_DB_USER,
            password: config.MYSQL_DB_PASSWORD,
            database: config.MYSQL_DB_NAME,
        });

        console.log(`Database ${config.MYSQL_DB_NAME} connected successfully.`);

        return connection_db;
    } catch (error) {
        if (mysql_connection) await mysql_connection.destroy();

        throw new Error(error.message || 'MySql Database Connection Failed.');
    }
}

export const mysql_db = await mysql_db_connection();