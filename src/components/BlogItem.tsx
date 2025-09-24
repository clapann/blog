import Link from "next/link";
import type { BlogSummary } from "@/types/blog";
import { formatDate, pluralize } from "@/lib/format";
import { Eye } from "lucide-react";

export default function BlogItem({ blog }: { blog: BlogSummary }) {
    return (
        <Link href={`/blog/${blog.id}`} className="block py-4 cursor-pointer">
            <h2 className="text-xl sm:text-2xl font-semibold text-[#0a0a0a] dark:text-white">
                {blog.title}
            </h2>

            <div className="text-sm text-[#374151] dark:text-[#9ca3af]">
                {formatDate(blog.timestamp)} · {pluralize(blog.readingTime, "min")}
            </div>

            <div className="text-sm text-[#374151] dark:text-[#9ca3af] flex items-center gap-1">
                <Eye size={14} /> {pluralize(blog.views ?? 0, "view")}
            </div>

            <p className="mt-3 text-base sm:text-md text-[#0a0a0a] dark:text-white">
                {blog.description}
            </p>
            
            <div className="mt-8 h-px w-full" style={{ backgroundColor: "#25262a" }} />
        </Link>
    );
}