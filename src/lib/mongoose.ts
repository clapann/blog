import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

type Cached = {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = global as unknown as { _mongoose: Cached | undefined };

const cached: Cached = globalForMongoose._mongoose || { conn: null, promise: null };
globalForMongoose._mongoose = cached;

export async function connectToDatabase() {
    if (cached.conn) return cached.conn;
    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, {}).then((m) => m);
    }
    cached.conn = await cached.promise;
    return cached.conn;
}