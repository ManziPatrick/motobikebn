import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

// Importing routes and controllers using ES Modules
import Register from './routes/register.js';
import Welcome from './controllers/welcome.js';

// Initialize dotenv for environment variables
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json()); // Parse JSON requests

// Define routes
app.get("/api/v1/welcome", Welcome);
app.use("/api/v1", Register);
const tableName = 'Riders'; 
// MongoDB connection function
const connectToMongoDb = () => {
    mongoose.connect(`mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.yqd0pr4.mongodb.net/${tableName}?retryWrites=true&w=majority`)
        .then(() => {
            console.log("MongoDB connected");
        })
        .catch((err) => {
            console.error("Failed to connect to MongoDB", err);
        });
};

// Start server
const port = 5300;
app.listen(port, () => {
    console.log(`Your server has been started on port ${port}`);
    connectToMongoDb();
});
