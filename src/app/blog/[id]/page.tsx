import { ArrowLeft, Eye } from "lucide-react";
import Link from "next/link";
import { fetchBlog, fetchBlogs } from "@/app/actions/blogs";
import { renderMarkdownToHtml } from "@/lib/markdown";
import ReactionButtons from "@/components/ReactionButtons";
import { formatDate, pluralize } from "@/lib/format";

type Params = { params: { id: string } };

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BlogPage({ params }: Params) {
    const id = Number(params.id);
    const blog = await fetchBlog(id);
    const html = await renderMarkdownToHtml(blog.content);

    return (
        <div className="min-h-screen grid bg-white dark:bg-[#09090b] grid-rows-[minmax(14vh,1fr)_auto_minmax(14vh,1fr)]">
            <div className="w-full max-w-3xl justify-self-center text-left px-[2.5vh] row-start-2">
                <Link href="/" className="inline-flex items-center gap-2 text-[#374151] dark:text-[#9ca3af]">
                    <ArrowLeft size={18} /> go back
                </Link>

                <h1 className="mt-4 text-xl sm:text-2xl font-semibold text-[#0a0a0a] dark:text-white">
                    {blog.title}
                </h1>

                <div className="text-sm text-[#374151] dark:text-[#9ca3af]">
                    {formatDate(blog.timestamp)} · {pluralize(blog.readingTime, "min")}
                </div>

                <div className="text-sm text-[#374151] dark:text-[#9ca3af] flex items-center gap-1">
                    <Eye size={14} /> {pluralize(blog.views ?? 0, "view")}
                </div>

                <p className="mt-3 text-base sm:text-md text-[#0a0a0a] dark:text-white">
                    {blog.description}
                </p>

                <div className="mt-6 h-px w-full" style={{ backgroundColor: "#25262a" }} />

                <article className="prose dark:prose-invert mt-6" dangerouslySetInnerHTML={{ __html: html }} />

                <ReactionButtons blogId={blog.id} initial={blog.reaction ?? null} />
            </div>
        </div>
    );
}

export async function generateStaticParams() {
    const blogs = await fetchBlogs();
    return blogs.map((b) => ({ id: String(b.id) }));
}