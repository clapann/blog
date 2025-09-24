import { cookies } from "next/headers";

function base64UrlFromBuffer(buf: Buffer): string {
    return buf.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function getSigningKey(): Promise<CryptoKey> {
    const keyData = new TextEncoder().encode(process.env.WEBAUTHN_COOKIE_SECRET);
    return crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function sign(payload: string): Promise<string> {
    const key = await getSigningKey();
    const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
    return base64UrlFromBuffer(Buffer.from(signature));
}

export async function validateToken(token: string): Promise<boolean> {
    const [payloadB64, sigB64] = token.split(".");
    if (!payloadB64 || !sigB64) return false;

    try {
        const payloadJson = Buffer.from(payloadB64.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
        const payload = JSON.parse(payloadJson) as { exp?: number };

        const key = await getSigningKey();
        const data = new TextEncoder().encode(payloadJson);
        const signature = Buffer.from(sigB64.replace(/-/g, "+").replace(/_/g, "/"), "base64");
        
        const valid = await crypto.subtle.verify("HMAC", key, signature, data);
        if (!valid) return false;

        if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return false;
        return true;
    } catch {
        return false;
    }
}

export async function validateSessionCookie(): Promise<boolean> {
    const token = (await cookies()).get("admin-session")?.value;
    if (!token) return false;
    return await validateToken(token);
}