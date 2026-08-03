import express from "express";
import morgan from "morgan";
import authRouter from "./route/auth.route.js";

const app = express();

// ? Explore express.urlencoded - Todo
// app.use(express.urlencoded({ extended: false }));

app.use(express.json());
app.use(morgan("dev"));

app.use('/api/auth', authRouter);

export default app;