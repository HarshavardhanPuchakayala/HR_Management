import express from "express";
import "dotenv/config";
import cors from "cors";
import { connectDB } from "./config/db.js";

import auth from "./routes/auth.js";
const Port = process.env.PORT || 3001;

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", auth);


app.listen(Port, () => {
  console.log(`Server running on port ${Port}`);
});