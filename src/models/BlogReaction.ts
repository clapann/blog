import { connectToDatabase } from "@/lib/mongoose";
import mongoose, { Schema, models, model } from "mongoose";

export type ReactionType = "up" | "down";

export interface BlogReactionDoc extends mongoose.Document {
    blogId: number;
    ip: string; // hashed with argon2, irreversible :)
    reaction: ReactionType;
    createdAt: Date;
    updatedAt: Date;
}

const BlogReactionSchema = new Schema<BlogReactionDoc>({
    blogId: { type: Number, required: true, index: true },
    ip: { type: String, required: true },
    reaction: { type: String, enum: ["up", "down"], required: true },
}, { timestamps: true });

BlogReactionSchema.index({ blogId: 1, ip: 1 }, { unique: true });

export async function getBlogReactionModel() {
    await connectToDatabase();
    return (models.BlogReaction as mongoose.Model<BlogReactionDoc>) || model<BlogReactionDoc>("BlogReaction", BlogReactionSchema);
}