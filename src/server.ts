import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db";
import userRoutes from "./routes/user.routes";
import cookieParser from "cookie-parser";

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 5010;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
