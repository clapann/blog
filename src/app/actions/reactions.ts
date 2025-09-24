"use server";

import { headers } from "next/headers";
import { setReaction } from "@/lib/reactions";
import type { ReactionType } from "@/models/BlogReaction";

export async function setBlogReaction(blogId: number, reaction: ReactionType) {
    const hdrs = await headers();
    const ip = hdrs.get("x-forwarded-for")?.split(",")[0] || hdrs.get("x-real-ip") || hdrs.get("cf-connecting-ip") || hdrs.get("x-client-ip") || "unknown";
    await setReaction(blogId, ip, reaction);
    
    return { ok: true };
}