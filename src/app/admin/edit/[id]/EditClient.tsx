"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import type { BlogContent } from "@/types/blog";
import { ArrowLeft, ThumbsUp, ThumbsDown, Eye, Save, Trash, FolderOpen } from "lucide-react";
import { renderMarkdownToHtml } from "@/lib/markdown";
import { useRouter } from "next/navigation";
import { formatDate, pluralize } from "@/lib/format";
import { marked } from "marked";
import readingTime from "reading-time";

export function computeReadingTimeMinutesFromMarkdown(md: string): number {
    try {
        const html = marked(md) as string;
        const temp = document.createElement("div");
        temp.innerHTML = html;
        const text = temp.textContent || "";
        const stats = readingTime(text);
        const minutes = Math.max(1, Math.round(stats.time / 60000));
        if (Number.isFinite(minutes) && minutes > 0) return minutes;
    } catch {}

    const fallbackStats = readingTime(md || "");
    return Math.max(1, Math.round(fallbackStats.time / 60000));
}

export default function EditClient({ blog, onSave, onDelete, }: { blog: BlogContent; onSave: (formData: FormData) => void | Promise<void>; onDelete: (formData: FormData) => void | Promise<void>; }) {
    const [title, setTitle] = useState(blog.title);
    const [description, setDescription] = useState(blog.description);
    const [content, setContent] = useState(blog.content);
    const [preview, setPreview] = useState(false);
    const [previewHtml, setPreviewHtml] = useState<string>("");
    const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const deleteConfirmTimeoutRef = useRef<number | null>(null);
    const unsavedWarningTimeoutRef = useRef<number | null>(null);

    const router = useRouter();

    const currentReadingTimeMin = computeReadingTimeMinutesFromMarkdown(content);

    async function handlePreviewClick() {
        const html = await renderMarkdownToHtml(content);
        setPreviewHtml(html);
        setPreview(true);
    }

    function handleBackFromEdit() {
        const hasUnsavedChanges = title !== blog.title || description !== blog.description || content !== blog.content;
        
        if (!hasUnsavedChanges) {
            router.push("/admin");
            return;
        }

        if (!showUnsavedWarning) {
            setShowUnsavedWarning(true);
            if (unsavedWarningTimeoutRef.current) {
                clearTimeout(unsavedWarningTimeoutRef.current);
            }
            unsavedWarningTimeoutRef.current = window.setTimeout(() => {
                setShowUnsavedWarning(false);
                unsavedWarningTimeoutRef.current = null;
            }, 5000);
            return;
        }

        router.push("/admin");
    }

    function handleDeleteClick(e: MouseEvent<HTMLButtonElement>) {
        if (!confirmDelete) {
            setConfirmDelete(true);
            if (deleteConfirmTimeoutRef.current) {
                clearTimeout(deleteConfirmTimeoutRef.current);
            }
            deleteConfirmTimeoutRef.current = window.setTimeout(() => {
                setConfirmDelete(false);
                deleteConfirmTimeoutRef.current = null;
            }, 5000);
            return;
        }
        if (deleteConfirmTimeoutRef.current) {
            clearTimeout(deleteConfirmTimeoutRef.current);
            deleteConfirmTimeoutRef.current = null;
        }
        e.currentTarget.form?.requestSubmit();
    }

    useEffect(() => {
        return () => {
            if (deleteConfirmTimeoutRef.current) {
                clearTimeout(deleteConfirmTimeoutRef.current);
            }
            if (unsavedWarningTimeoutRef.current) {
                clearTimeout(unsavedWarningTimeoutRef.current);
            }
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
                        {blog.title}
                    </h1>

                    <div className="text-sm text-[#374151] dark:text-[#9ca3af]">
                        {formatDate(blog.timestamp)} · {pluralize(currentReadingTimeMin, "min")}
                    </div>

                    <div className="text-sm text-[#374151] dark:text-[#9ca3af] flex items-center gap-1">
                        <Eye size={14} /> {pluralize(blog.views ?? 0, "view")}
                    </div>

                    <p className="mt-3 text-base sm:text-md text-[#0a0a0a] dark:text-white">
                        {blog.description}
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
                    <button type="button" onClick={handleBackFromEdit} className={`inline-flex items-center gap-2 cursor-pointer ${showUnsavedWarning ? 'text-[#ef4444]' : 'text-[#374151] dark:text-[#9ca3af]'}`}>
                        <ArrowLeft size={18} /> <p id="go-back">{showUnsavedWarning ? "you have unsaved changes, you sure?" : "go back"}</p>
                    </button>

                    <h2 className="mt-4 text-xl sm:text-2xl font-semibold text-[#0a0a0a] dark:text-white">edit blog post</h2>
                    <p className="text-sm text-[#374151] dark:text-[#9ca3af]">update title, description, and content</p>

                    <form id="save-form" action={onSave} className="mt-6 space-y-4">
                        <input type="hidden" name="id" value={String(blog.id)} />
                        <input type="hidden" name="readingTime" value={String(currentReadingTimeMin)} />

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
                        <form action={onDelete}>
                            <button type="button" onClick={handleDeleteClick} className="px-2 py-1 rounded-md border border-[#25262a] text-[#ef4444] flex items-center gap-2 cursor-pointer text-sm">
                                <Trash size={14} />
                                {confirmDelete ? "you sure?" : "delete"}
                            </button>
                        </form>
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


