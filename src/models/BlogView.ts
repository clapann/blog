import { connectToDatabase } from "@/lib/mongoose";
import mongoose, { Schema, models, model } from "mongoose";

export interface BlogViewDoc extends mongoose.Document {
    blogId: number;
    ip: string; // hashed with argon2, irreversible :)
    createdAt: Date;
}

const BlogViewSchema = new Schema<BlogViewDoc>({
    blogId: { type: Number, required: true, index: true },
    ip: { type: String, required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

BlogViewSchema.index({ blogId: 1, ip: 1 }, { unique: true });

export async function getBlogViewModel() {
    await connectToDatabase();
    return (models.BlogView as mongoose.Model<BlogViewDoc>) || model<BlogViewDoc>("BlogView", BlogViewSchema);
}