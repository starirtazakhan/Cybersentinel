const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

console.log("MongoDB connected successfully");
console.log("MongoDB Host:", mongoose.connection.host);
console.log("MongoDB Port:", mongoose.connection.port);
console.log("Database:", mongoose.connection.name);
console.log("User Collection:", mongoose.connection.collection("users").name);
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    }
};

module.exports = connectDB;