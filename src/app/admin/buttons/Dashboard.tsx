"use client";

import { useRouter } from "next/navigation";
import { Settings } from "lucide-react";

export default function DashboardButton() {
	const router = useRouter();

	function onNavigate() {
		router.push("/admin");
	}

	return (
		<div className="mt-2">
			<button onClick={onNavigate} className="px-4 py-2 rounded-md border border-[#25262a] text-[#0a0a0a] dark:text-white flex items-center gap-2 cursor-pointer">
                <Settings size={17} />
				go to dashboard
			</button>
		</div>
	);
}