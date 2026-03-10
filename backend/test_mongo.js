import mongoose from 'mongoose';

const uri = "mongodb+srv://kirishnaaclusterrr:krishna123@cluster0.j4rdmgi.mongodb.net/MessWise";

async function run() {
    try {
        await mongoose.connect(uri);
        console.log("Connected successfully to MongoDB");
    } catch (err) {
        console.error("Connection error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
