export const dynamic = "force-dynamic";

import { fetchBlogs, fetchBlogReactions } from "@/app/actions/blogs";
import { HeartCrack, Eye, ThumbsUp, ThumbsDown, Pencil, Plus } from "lucide-react";
import { formatDate, pluralize } from "@/lib/format";
import Link from "next/link";

export default async function DashboardContent() {
    const blogs = await fetchBlogs();
    const reactionsMap = new Map<number, { up: number; down: number }>();

    for (const blog of blogs) {
        const reactions = await fetchBlogReactions(blog.id);
        reactionsMap.set(blog.id, reactions);
    }

    return (
        <div className="min-h-screen grid bg-white dark:bg-[#09090b] grid-rows-[minmax(14vh,1fr)_auto_minmax(14vh,1fr)]">
            <div className="w-full max-w-3xl justify-self-center text-left px-[2.5vh] row-start-2">
                <h1 className="text-3xl sm:text-4xl font-bold text-[#0a0a0a] dark:text-white">welcome back, root!</h1>
                <p className="text-lg sm:text-xl text-[#374151] dark:text-[#9ca3af]">create and manage blogs</p>

                <section className="mt-3">
                    <div className="mb-4">
                        <Link href={`/admin/new`} className="px-2 py-1 rounded-md border border-[#25262a] text-[#0a0a0a] dark:text-white flex items-center gap-2 cursor-pointer w-fit">
                            <Plus size={14} />
                            new post
                        </Link>
                    </div>
                    {blogs.length === 0 ? (
                        <div className="flex items-center gap-2">
                            <HeartCrack size={16} className="text-[#ef4444]" />
                            <p className="text-[#6b7280] dark:text-[#9ca3af]">No blogs yet.</p>
                        </div>
                    ) : (
                        blogs.map((blog) => {
                            const reactions = reactionsMap.get(blog.id) || { up: 0, down: 0 };
                            return <div key={blog.id} className="py-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-base sm:text-lg font-semibold text-[#0a0a0a] dark:text-white truncate">{blog.title}</h2>
                                            <span className="text-xs sm:text-sm text-[#374151] dark:text-[#9ca3af] whitespace-nowrap">{formatDate(blog.timestamp)} · {pluralize(blog.readingTime, "min")}</span>
                                        </div>
                                        <div className="text-xs sm:text-sm text-[#374151] dark:text-[#9ca3af] flex items-center gap-1 pb-3">
                                            <span className="flex items-center gap-1"><Eye size={14} /> {pluralize(blog.views ?? 0, "view")}</span>
                                            ·
                                            <span className="flex items-center gap-1"><ThumbsUp size={14} /> {Number(reactions.up).toLocaleString()}</span>
                                            <span className="flex items-center gap-1"><ThumbsDown size={14} /> {Number(reactions.down).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="shrink-0 flex items-center gap-2">
                                        <Link href={`/admin/edit/${blog.id}`} className="px-2 py-1 rounded-md border border-[#25262a] text-[#0a0a0a] dark:text-white flex items-center gap-2 cursor-pointer">
                                            <Pencil size={14} /> 
                                            edit
                                        </Link>
                                    </div>
                                </div>
                                
                                <div className="mt-3 h-px w-full" style={{ backgroundColor: "#25262a" }} />
                            </div>;
                        })
                    )}
                </section>
            </div>
        </div>
    );
}