import { connectToDatabase } from "@/lib/mongoose";
import mongoose, { Schema, models, model } from "mongoose";

export interface BlogDoc extends mongoose.Document {
    id: number;
    title: string;
    description: string;
    readingTime: number;
    timestamp: number;
    content: string;
}

const BlogSchema = new Schema<BlogDoc>({
    id: { type: Number, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    readingTime: { type: Number, required: true },
    timestamp: { type: Number, required: true },
    content: { type: String, required: true },
});

export async function getBlogModel() {
    await connectToDatabase();
    return (models.Blog as mongoose.Model<BlogDoc>) || model<BlogDoc>("Blog", BlogSchema);
}