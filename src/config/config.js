import dotenv from "dotenv";

dotenv.config();

if (!process.env.APP_PORT) {
    throw new Error('PORT key is not defined in environment variables');
}

const config = {
    APP_PORT: process.env.APP_PORT
}

export default config;