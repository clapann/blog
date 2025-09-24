"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { setBlogReaction } from "@/app/actions/reactions";

type Reaction = "up" | "down";

export default function ReactionButtons({ blogId, initial }: { blogId: number; initial: Reaction | null }) {
    const [selected, setSelected] = useState<Reaction | null>(initial);

    return (
        <form className="mt-6 flex justify-center">
            <div className="border border-[#25262a] rounded-lg px-4 py-1 flex items-center gap-1">
                <p className="text-[#0a0a0a] dark:text-white text-sm">did you enjoy this post?</p>
                <div className="flex items-center">
                    <button className="p-2 rounded-md" aria-pressed={selected === "up"}
                        onClick={(e) => {
                            if (selected === "up") {
                                e.preventDefault();
                                return;
                            }
                            setSelected("up");
                        }}
                        formAction={async () => { await setBlogReaction(blogId, "up"); }}>

                        <ThumbsUp size={14} className={selected === "up" ? "text-[#0a0a0a] dark:text-white" : "text-[#374151] dark:text-[#9ca3af] hover:text-[#0a0a0a] dark:hover:text-white transition-colors duration-300"}/>
                    </button>
                    <button className="p-2 rounded-md" aria-pressed={selected === "down"}
                        onClick={(e) => {
                            if (selected === "down") {
                                e.preventDefault();
                                return;
                            }
                            setSelected("down");
                        }}
                        formAction={async () => { await setBlogReaction(blogId, "down"); }}>

                        <ThumbsDown size={14} className={selected === "down" ? "text-[#0a0a0a] dark:text-white" : "text-[#374151] dark:text-[#9ca3af] hover:text-[#0a0a0a] dark:hover:text-white transition-colors duration-300"} />
                    </button>
                </div>
            </div>
        </form>
    );
}