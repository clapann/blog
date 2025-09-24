"use server";

import { getBlogModel } from "@/models/Blog";
import { connectToDatabase } from "@/lib/mongoose";
import { countViews, recordViewAndCount } from "@/lib/views";
import { headers } from "next/headers";
import type { BlogSummary, BlogContent } from "@/types/blog";
import { getReaction } from "@/lib/reactions";
import { validateSessionCookie } from "@/lib/auth";
import { getBlogReactionModel } from "@/models/BlogReaction";
import { revalidatePath } from "next/cache";

export async function fetchBlogs(): Promise<BlogSummary[]> {
    const Blog = await getBlogModel();
    const docs = await Blog.find({}, { _id: 0, __v: 0 }).sort({ timestamp: -1 }).lean();
    const withViews = await Promise.all(docs.map(async (d) => ({ ...d, views: await countViews(d.id) })));

    return withViews;
}

export async function fetchBlog(id: number): Promise<BlogContent> {
    const Blog = await getBlogModel();
    const blog = await Blog.findOne({ id }, { _id: 0, __v: 0 }).lean();
    if (!blog) throw new Error("Blog not found");

    const hdrs = await headers();
    const ip = hdrs.get("x-forwarded-for")?.split(",")[0] || hdrs.get("x-real-ip") || hdrs.get("x-client-ip") || "unknown";
    const views = await recordViewAndCount(id, ip);
    const reaction = await getReaction(id, ip);
    
    return { ...(blog as BlogContent), views, reaction } as BlogContent;
}

export async function fetchBlogReactions(id: number): Promise<{ up: number; down: number }> {
    const BlogReaction = await getBlogReactionModel();
    const result = await BlogReaction.aggregate([
        { $match: { blogId: id } },
        { $group: { _id: "$reaction", count: { $sum: 1 } } }
    ]);
    
    const counts = { up: 0, down: 0 };
    result.forEach(item => {
        counts[item._id as "up" | "down"] = item.count;
    });
    
    return counts;
}

export async function fetchBlogForAdmin(id: number): Promise<BlogContent | { ok: false; status: 401; error: "unauthorized" }> {
    const authed = await validateSessionCookie();
    if (!authed) {
        return { ok: false as const, status: 401 as const, error: "unauthorized" };
    }

    const Blog = await getBlogModel();
    const blog = await Blog.findOne({ id }, { _id: 0, __v: 0 }).lean();
    if (!blog) throw new Error("Blog not found");
    const views = await countViews(id);

    return { ...(blog as BlogContent), views } as BlogContent;
}

export async function updateBlog(params: { id: number; title: string; description: string; content: string; readingTime?: number }) {
    const authed = await validateSessionCookie();
    if (!authed) {
        return { ok: false as const, status: 401 as const, error: "unauthorized" };
    }

    const { id, title, description, content } = params;
    if (!id || !title?.trim() || !description?.trim() || !content?.trim()) {
        return { ok: false as const, status: 400 as const, error: "missing-fields" };
    }

    const Blog = await getBlogModel();
    await connectToDatabase();

    const providedReadingTime = Number((params as { readingTime?: number }).readingTime);
    const readingTime = Number.isFinite(providedReadingTime) && providedReadingTime >= 1 ? Math.round(providedReadingTime) : Math.max(1, Math.round(content.trim().split(/\s+/g).length / 200));

    const result = await Blog.updateOne(
        { id },
        { $set: { title, description, content, readingTime } }
    );

    if (result.matchedCount === 0) {
        return { ok: false as const, status: 404 as const, error: "not-found" };
    }

    revalidatePath("/admin");
    revalidatePath(`/blog/${id}`);
    return { ok: true as const };
}

export async function deleteBlog(id: number) {
    const authed = await validateSessionCookie();
    if (!authed) {
        return { ok: false as const, status: 401 as const, error: "unauthorized" };
    }

    const Blog = await getBlogModel();
    await connectToDatabase();
    await Blog.deleteOne({ id });
    revalidatePath("/admin");
    return { ok: true as const };
}

export async function createBlog(params: { title: string; description: string; content: string; readingTime?: number }) {
    const authed = await validateSessionCookie();
    if (!authed) {
        return { ok: false as const, status: 401 as const, error: "unauthorized" };
    }

    const title = (params.title || "").trim();
    const description = (params.description || "").trim();
    const content = (params.content || "").trim();
    if (!title || !description || !content) {
        return { ok: false as const, status: 400 as const, error: "missing-fields" };
    }

    const Blog = await getBlogModel();
    await connectToDatabase();

    const last = await Blog.findOne({}, { id: 1 }).sort({ id: -1 }).lean();
    const id = ((last as { id?: number } | null)?.id || 0) + 1;

    const providedReadingTime = Number((params as { readingTime?: number }).readingTime);
    const computedReadingTime = Number.isFinite(providedReadingTime) && providedReadingTime >= 1
        ? Math.round(providedReadingTime)
        : Math.max(1, Math.round(content.split(/\s+/g).length / 200));

    const timestamp = Math.floor(Date.now() / 1000);

    await Blog.create({ id, title, description, content, readingTime: computedReadingTime, timestamp });

    revalidatePath("/admin");
    revalidatePath(`/blog/${id}`);
    return { ok: true as const, id };
}