export const dynamic = "force-dynamic";

import { redirect, notFound } from "next/navigation";
import { validateSessionCookie } from "@/lib/auth";
import { fetchBlogForAdmin, updateBlog, deleteBlog } from "@/app/actions/blogs";
import EditClient from "./EditClient";

type Params = { params: { id: string } };

export default async function EditBlogPage({ params }: Params) {
    const authed = await validateSessionCookie();
    
    if (!authed) {
        redirect("/admin");
    }

    const idNum = Number(params.id);
    if (!Number.isFinite(idNum)) {
        notFound();
    }

    let blog;
    try {
        blog = await fetchBlogForAdmin(idNum);
    } catch {
        notFound();
    }

    if ("error" in blog) {
        redirect("/admin");
    }

    async function onSave(formData: FormData) {
        "use server";

        const id = Number(formData.get("id"));
        const title = String(formData.get("title") || "");
        const description = String(formData.get("description") || "");
        const content = String(formData.get("content") || "");
        const readingTimeRaw = Number(formData.get("readingTime"));
        const readingTime = Number.isFinite(readingTimeRaw) ? Math.max(1, Math.round(readingTimeRaw)) : undefined;
        const res = await updateBlog({ id, title, description, content, readingTime });

        if (res.ok) {
            redirect("/admin");
        }
        
        return;
    }

    async function onDelete() {
        "use server";
        
        await deleteBlog(idNum);
        redirect("/admin");
    }

    return (
        <div className="min-h-screen grid bg-white dark:bg-[#09090b] grid-rows-[minmax(14vh,1fr)_auto_minmax(14vh,1fr)]">
            <div className="w-full max-w-3xl justify-self-center text-left px-[2.5vh] row-start-2 text-sm">
                <EditClient blog={blog} onSave={onSave} onDelete={onDelete} />
            </div>
        </div>
    );
}