import { getBlogViewModel } from "@/models/BlogView";
import argon2 from "argon2";

export async function countViews(blogId: number): Promise<number> {
    const BlogView = await getBlogViewModel();
    return BlogView.countDocuments({ blogId });
}

export async function recordViewAndCount(blogId: number, ip: string | null | undefined): Promise<number> {
    if (!ip) return countViews(blogId);

    const BlogView = await getBlogViewModel();
    
    try {
        const hashed = await hashIp(ip);
        await BlogView.create({ blogId, ip: hashed });
    } catch (error: unknown) { // ignore duplicate errors.
        if ((error as { code?: number }).code !== 11000) throw error;
    }
    
    return BlogView.countDocuments({ blogId });
}

export async function hashIp(ip: string): Promise<string> {
    const secret = process.env.IP_HASH_SALT as string;
    return argon2.hash(ip, { type: argon2.argon2id, salt: Buffer.from(secret) });
}