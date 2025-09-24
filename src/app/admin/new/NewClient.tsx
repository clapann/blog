"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, FolderOpen, Save, X, Eye } from "lucide-react";
import { renderMarkdownToHtml } from "@/lib/markdown";
import { useRouter } from "next/navigation";
import { formatDate, pluralize } from "@/lib/format";
import { computeReadingTimeMinutesFromMarkdown } from "../edit/[id]/EditClient";
import { ThumbsUp, ThumbsDown } from "lucide-react";

export default function NewClient({ onSave }: { onSave: (formData: FormData) => void | Promise<void> }) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [content, setContent] = useState("");
    const [preview, setPreview] = useState(false);
    const [previewHtml, setPreviewHtml] = useState<string>("");
    const [confirmCancel, setConfirmCancel] = useState(false);
    const cancelConfirmTimeoutRef = useRef<number | null>(null);

    const router = useRouter();

    const currentReadingTimeMin = computeReadingTimeMinutesFromMarkdown(content);

    async function handlePreviewClick() {
        const html = await renderMarkdownToHtml(content);
        setPreviewHtml(html);
        setPreview(true);
    }

    function handleCancelClick() {
        const hasAny = !!(title.trim() || description.trim() || content.trim());
        if (!hasAny) {
            router.push("/admin");
            return;
        }

        if (!confirmCancel) {
            setConfirmCancel(true);
            if (cancelConfirmTimeoutRef.current) clearTimeout(cancelConfirmTimeoutRef.current);
            cancelConfirmTimeoutRef.current = window.setTimeout(() => {
                setConfirmCancel(false);
                cancelConfirmTimeoutRef.current = null;
            }, 5000);
            return;
        }

        if (cancelConfirmTimeoutRef.current) {
            clearTimeout(cancelConfirmTimeoutRef.current);
            cancelConfirmTimeoutRef.current = null;
        }
        
        router.push("/admin");
    }

    useEffect(() => {
        return () => {
            if (cancelConfirmTimeoutRef.current) clearTimeout(cancelConfirmTimeoutRef.current);
        };
    }, []);

    return (
        <div>
            {preview ? (
                <div>
                    <button onClick={() => setPreview(false)} className="inline-flex items-center gap-2 text-[#374151] dark:text-[#9ca3af] cursor-pointer">
                        <ArrowLeft size={18} /> go back
                    </button>

                    <h1 className="mt-4 text-xl sm:text-2xl font-semibold text-[#0a0a0a] dark:text-white">
                        {title}
                    </h1>

                    <div className="text-sm text-[#374151] dark:text-[#9ca3af]">
                        {formatDate(Math.floor(Date.now() / 1000))} · {pluralize(currentReadingTimeMin, "min")}
                    </div>

                    <div className="text-sm text-[#374151] dark:text-[#9ca3af] flex items-center gap-1">
                        <Eye size={14} /> {pluralize(0, "view")}
                    </div>

                    <p className="mt-3 text-base sm:text-md text-[#0a0a0a] dark:text-white">
                        {description}
                    </p>

                    <div className="mt-6 h-px w-full" style={{ backgroundColor: "#25262a" }} />

                    <article className="prose dark:prose-invert mt-6" dangerouslySetInnerHTML={{ __html: previewHtml }} />

                    <div className="mt-6 flex justify-center">
                        <div className="border border-[#25262a] rounded-lg px-4 py-1 flex items-center gap-1">
                            <p className="text-[#0a0a0a] dark:text-white text-sm">did you enjoy this post?</p>
                            <div className="flex items-center">
                                <button className="p-2 rounded-md">
                                    <ThumbsUp size={14} className="text-[#374151] dark:text-[#9ca3af] hover:text-[#0a0a0a] dark:hover:text-white transition-colors duration-300"/>
                                </button>
                                <button className="p-2 rounded-md">
                                    <ThumbsDown size={14} className="text-[#374151] dark:text-[#9ca3af] hover:text-[#0a0a0a] dark:hover:text-white transition-colors duration-300" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div>
                    <h2 className="mt-4 text-xl sm:text-2xl font-semibold text-[#0a0a0a] dark:text-white">new blog post</h2>

                    <form id="save-form" action={onSave} className="mt-6 space-y-4">
                        <div>
                            <label className="block text-sm text-[#9ca3af]">title</label>
                            <input name="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="catchy title belongs here" className="mt-1 w-full rounded-md border border-[#25262a] bg-transparent px-3 py-2 text-[#0a0a0a] dark:text-white" />
                        </div>

                        <div>
                            <label className="block text-sm text-[#9ca3af]">description</label>
                            <input name="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="summarize the blog post" className="mt-1 w-full rounded-md border border-[#25262a] bg-transparent px-3 py-2 text-[#0a0a0a] dark:text-white" />
                        </div>

                        <div>
                            <label className="block text-sm text-[#9ca3af]">content</label>
                            <textarea
                                name="content"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="yap away.. (markdown is enabled)"
                                rows={16}
                                className="mt-1 w-full rounded-md border border-[#25262a] bg-transparent px-3 py-2 font-mono text-sm text-[#0a0a0a] dark:text-white resize-y min-h-[320px]"
                            />
                        </div>
                    </form>

                    <div className="mt-4 flex items-center gap-2">
                        <button form="save-form" type="submit" className="px-2 py-1 rounded-md border border-[#25262a] text-[#0a0a0a] dark:text-white flex items-center gap-2 cursor-pointer text-sm">
                            <Save size={14} />
                            save
                        </button>
                        <button type="button" onClick={handleCancelClick} className={`px-2 py-1 rounded-md border border-[#25262a] ${confirmCancel ? 'text-[#ef4444]' : 'text-[#0a0a0a] dark:text-white'} flex items-center gap-2 cursor-pointer text-sm`}>
                            <X size={14} />
                            {confirmCancel ? 'you sure?' : 'cancel'}
                        </button>
                        <button type="button" onClick={handlePreviewClick} className="px-2 py-1 rounded-md border border-[#25262a] text-[#0a0a0a] dark:text-white flex items-center gap-2 cursor-pointer text-sm">
                            <FolderOpen size={14} />
                            preview
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}