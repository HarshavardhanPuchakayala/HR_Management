import mongoose from "mongoose";

const connectDB = async () => {
  if (!process.env.MONGO_URL) {
    throw new Error(
      "MONGO_URL is not configured"
    );
  }

  try {
    await mongoose.connect(
      process.env.MONGO_URL,
      {
        serverSelectionTimeoutMS: 10000,
      }
    );

    console.log("MongoDB connected");
  } catch (error) {
    console.error(
      "MongoDB connection failed:",
      error.message
    );

    process.exit(1);
  }
};

export default connectDB;