export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { validateSessionCookie } from "@/lib/auth";
import NewClient from "./NewClient";
import { createBlog } from "@/app/actions/blogs";

export default async function NewBlogPage() {
    const authed = await validateSessionCookie();
    if (!authed) {
        redirect("/admin");
    }

    async function onSave(formData: FormData) {
        "use server";
        const title = String(formData.get("title") || "");
        const description = String(formData.get("description") || "");
        const content = String(formData.get("content") || "");
        const res = await createBlog({ title, description, content });
        if (res.ok) {
            redirect(`/admin`);
        }
        return;
    }

    return (
        <div className="min-h-screen grid bg-white dark:bg-[#09090b] grid-rows-[minmax(14vh,1fr)_auto_minmax(14vh,1fr)]">
            <div className="w-full max-w-3xl justify-self-center text-left px-[2.5vh] row-start-2 text-sm">
                <NewClient onSave={onSave} />
            </div>
        </div>
    );
}


