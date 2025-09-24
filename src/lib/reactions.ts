import { getBlogReactionModel, type ReactionType } from "@/models/BlogReaction";
import { hashIp } from "./views";

export async function getReaction(blogId: number, ip: string | null | undefined): Promise<ReactionType | null> {
    if (!ip) return null;

    const BlogReaction = await getBlogReactionModel();
    const hashed = await hashIp(ip);
    const doc = await BlogReaction.findOne({ blogId, ip: hashed }, { reaction: 1, _id: 0 }).lean();
    return doc?.reaction ?? null;
}

export async function setReaction(blogId: number, ip: string | null | undefined, reaction: ReactionType): Promise<ReactionType> {
    if (!ip) return reaction;
    
    const BlogReaction = await getBlogReactionModel();
    const hashed = await hashIp(ip);
    
    await BlogReaction.updateOne(
        { blogId, ip: hashed },
        { $set: { reaction } },
        { upsert: true },
    );
    
    return reaction;
}