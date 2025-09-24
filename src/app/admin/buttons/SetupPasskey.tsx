"use client";

import { useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import { useRouter } from "next/navigation";
import { ScanFace } from "lucide-react";
import { getRegistrationOptions, verifyRegistration } from "@/app/actions/webauthn";

export default function SetupPasskey() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();

	async function onCreate() {
		setLoading(true);
		setError(null);

		try {
            const optionsRes = await getRegistrationOptions();
            if (optionsRes.ok !== true) throw new Error(optionsRes.error || "failed to get registration options");

            const options = optionsRes.options!;

			const attResp = await startRegistration({ optionsJSON: options });
            const verifyRes = await verifyRegistration(attResp);
            if (!verifyRes.ok) throw new Error(verifyRes.error || "verification failed");
			
            router.replace("/admin?success=true");
		} catch (e: unknown) {
			setError((e as Error).message || "something went wrong");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="mt-2">
			<button onClick={onCreate} disabled={loading} className="px-4 py-2 rounded-md border border-[#25262a] text-[#0a0a0a] dark:text-white disabled:opacity-50 flex items-center gap-2 cursor-pointer">
                <ScanFace size={17} />
				{loading ? "creating.." : "create passkey"}
			</button>
			{error && <p className="mt-3 text-sm text-red-500">{error}</p>}
		</div>
	);
}

