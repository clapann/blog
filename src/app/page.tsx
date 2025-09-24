import BlogList from "@/components/BlogList";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Home() {
	return (
		<div className="min-h-screen grid bg-white dark:bg-[#09090b] grid-rows-[minmax(14vh,1fr)_auto_minmax(14vh,1fr)]">
			<div className="w-full max-w-3xl justify-self-center text-left px-[2.5vh] row-start-2">
				<h1 className="text-3xl sm:text-4xl font-bold text-[#0a0a0a] dark:text-white">steven&apos;s blog</h1>
				<p className="text-lg sm:text-xl text-[#374151] dark:text-[#9ca3af]">this is steven&apos;s personal blog</p>

				<BlogList />
			</div>
		</div>
	);
}