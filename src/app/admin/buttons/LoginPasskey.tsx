"use client";

import { useState } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { getAuthenticationOptions, verifyAuthentication } from "@/app/actions/webauthn";

export default function LoginPasskey() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    async function onLogin() {
        setLoading(true);
        setError(null);

        try {
            const optionsRes = await getAuthenticationOptions();
            if (!optionsRes.ok) throw new Error(optionsRes.error || "failed to get authentication options");
            
            const asseResp = await startAuthentication({ optionsJSON: optionsRes.options! });
            const verifyRes = await verifyAuthentication(asseResp);
            if (!verifyRes.ok) throw new Error(verifyRes.error || "verification failed");

            router.replace("/admin");
        } catch (e: unknown) {
            setError((e as Error).message || "something went wrong");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mt-2">
            <button onClick={onLogin} disabled={loading} className="px-4 py-2 rounded-md border border-[#25262a] text-[#0a0a0a] dark:text-white disabled:opacity-50 flex items-center gap-2 cursor-pointer">
                <LogIn size={17} />
                {loading ? "authenticating.." : "log in with passkey"}
            </button>
            {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        </div>
    );
}