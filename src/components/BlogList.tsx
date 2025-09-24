import BlogItem from "@/components/BlogItem";
import { fetchBlogs } from "@/app/actions/blogs";
import { HeartCrack } from "lucide-react";

export default async function BlogList() {
    const blogs = await fetchBlogs();

    return (
        <section className="mt-6">
            {blogs.length === 0 ? (
                <div className="flex items-center gap-2">
                    <HeartCrack size={16} className="text-[#ef4444]" />
                    <p className="text-[#6b7280] dark:text-[#9ca3af]">No blogs yet.</p>
                </div>
            ) : (
                blogs.map((blog) => (
                    <BlogItem key={`${blog.timestamp}-${blog.title}`} blog={blog} />
                ))
            )}
        </section>
    );
}