"use server";

import { cookies, headers } from "next/headers";
import { randomBytes } from "crypto";
import { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } from "@simplewebauthn/server";
import type { RegistrationResponseJSON, AuthenticationResponseJSON, AuthenticatorTransportFuture, } from "@simplewebauthn/server";
import { isoUint8Array } from "@simplewebauthn/server/helpers";
import { getPasskeyModel } from "@/models/Passkey";
import { rpID as cfgRpID, rpName, origin as cfgOrigin } from "@/lib/webauthn";
import { sign } from "@/lib/auth";

function base64url(input: Buffer | string): string {
    const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
    return buf.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function setSessionCookie() {
    const cookieStore = await cookies();
    const ttlHours = Number(process.env.WEBAUTHN_PASSKEY_TTL as string);
    const ttl = Math.floor(((hours) => Number.isFinite(hours) && hours > 0 ? hours : 2)(ttlHours) * 3600);
    const now = Math.floor(Date.now() / 1000);
    const payload = {
        sub: "root",
        iat: now,
        exp: now + ttl,
        jti: randomBytes(16).toString("hex"),
    };
    const payloadJson = JSON.stringify(payload);
    const sig = await sign(payloadJson);
    const token = `${base64url(Buffer.from(payloadJson))}.${sig}`;

    cookieStore.set({
        name: "admin-session",
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: ttl,
    });
}

async function getRuntimeRpConfig() {
    const hdrs = await headers();
    const xfProto = hdrs.get("x-forwarded-proto");
    const xfHost = hdrs.get("x-forwarded-host");
    const host = xfHost || hdrs.get("host") || "localhost:3000";
    const proto = xfProto || (host.startsWith("localhost") || host.includes(":") ? "http" : "https");
    const runtimeOrigin = `${proto}://${host}`;
    const expectedOrigin = cfgOrigin || runtimeOrigin;
    const runtimeRpId = host.split(":")[0];
    const runtimeRpID = cfgRpID || runtimeRpId;
    return { expectedOrigin, runtimeRpID };
}

export async function getRegistrationOptions() {
    const Passkey = await getPasskeyModel();
    const exists = await Passkey.exists({});
    if (exists) {
        return { ok: false, status: 409 as const, error: "already-initialized" };
    }

    const { runtimeRpID } = await getRuntimeRpConfig();
    const options = await generateRegistrationOptions({
        rpName,
        rpID: runtimeRpID,
        userID: isoUint8Array.fromUTF8String("root"),
        userName: "root",
        userDisplayName: "root",
        attestationType: "none",
        supportedAlgorithmIDs: [-7, -257],
        authenticatorSelection: {
            residentKey: "preferred",
            userVerification: "preferred",
            requireResidentKey: false,
        },
        excludeCredentials: [],
    });

    const cookieStore = await cookies();
    cookieStore.set({
        name: "webauthn-registration-challenge",
        value: options.challenge,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 5,
    });

    return { ok: true as const, options };
}

export async function verifyRegistration(attResp: RegistrationResponseJSON) {
    const Passkey = await getPasskeyModel();
    const exists = await Passkey.exists({});
    if (exists) {
        return { ok: false, status: 409 as const, error: "already-initialized" };
    }

    const cookieStore = await cookies();
    const expectedChallenge = cookieStore.get("webauthn-registration-challenge")?.value;
    if (!expectedChallenge) {
        return { ok: false, status: 400 as const, error: "challenge-missing" };
    }

    try {
        const { expectedOrigin, runtimeRpID } = await getRuntimeRpConfig();
        const verification = await verifyRegistrationResponse({
            response: attResp,
            expectedChallenge,
            expectedOrigin,
            expectedRPID: runtimeRpID,
            requireUserVerification: false,
        });

        const { verified, registrationInfo } = verification;
        if (!verified || !registrationInfo) {
            return { ok: false, status: 400 as const, error: "not-verified" };
        }

        const { credential } = registrationInfo;
        await Passkey.create({
            userId: "root",
            credentialId: credential.id,
            publicKey: Buffer.from(credential.publicKey),
            counter: credential.counter,
            transports: credential.transports ?? [],
        });

        cookieStore.set({ name: "webauthn-registration-challenge", value: "", maxAge: 0, path: "/" });
        await setSessionCookie();
        return { ok: true as const };
    } catch {
        return { ok: false, status: 400 as const, error: "verification-failed" };
    }
}

export async function getAuthenticationOptions() {
    const Passkey = await getPasskeyModel();
    const passkey = await Passkey.findOne({});
    if (!passkey) {
        return { ok: false, status: 404 as const, error: "not-initialized" };
    }

    const { runtimeRpID } = await getRuntimeRpConfig();
    const options = await generateAuthenticationOptions({
        rpID: runtimeRpID,
        userVerification: "preferred",
        allowCredentials: [
            {
                id: passkey.credentialId,
                transports: passkey.transports as AuthenticatorTransportFuture[],
            },
        ],
    });

    const cookieStore = await cookies();
    cookieStore.set({
        name: "webauthn-authentication-challenge",
        value: options.challenge,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 5,
    });

    return { ok: true as const, options };
}

export async function verifyAuthentication(attResp: AuthenticationResponseJSON) {
    const Passkey = await getPasskeyModel();
    let passkey = await Passkey.findOne({ credentialId: attResp.rawId });

    if (!passkey) {
        const allPasskeys = await Passkey.find({});
        for (const pk of allPasskeys) {
            if (Buffer.isBuffer(pk.credentialId)) {
                const credIdString = pk.credentialId.toString("base64url");
                if (credIdString === attResp.rawId) {
                    passkey = pk;
                    break;
                }
            }
        }
    }

    if (!passkey) {
        return { ok: false, status: 404 as const, error: "credential-not-found" };
    }

    const cookieStore = await cookies();
    const expectedChallenge = cookieStore.get("webauthn-authentication-challenge")?.value;
    if (!expectedChallenge) {
        return { ok: false, status: 400 as const, error: "challenge-missing" };
    }

    try {
        const { expectedOrigin, runtimeRpID } = await getRuntimeRpConfig();

        const credentialIdB64Url = Buffer.isBuffer(passkey.credentialId) ? passkey.credentialId.toString("base64url") : passkey.credentialId;

        const publicKeyUint8Array = new Uint8Array(passkey.publicKey);

        const verification = await verifyAuthenticationResponse({
            response: attResp,
            expectedChallenge,
            expectedOrigin,
            expectedRPID: runtimeRpID,
            requireUserVerification: false,
            credential: {
                id: credentialIdB64Url,
                publicKey: publicKeyUint8Array,
                counter: passkey.counter ?? 0,
                transports: (passkey.transports ?? []) as AuthenticatorTransportFuture[],
            },
        });

        const { verified, authenticationInfo } = verification;
        if (!verified || !authenticationInfo) {
            return { ok: false, status: 400 as const, error: "not-verified" };
        }

        await Passkey.updateOne(
            { _id: passkey._id },
            { $set: { counter: authenticationInfo.newCounter } },
        );

        cookieStore.set({ name: "webauthn-authentication-challenge", value: "", maxAge: 0, path: "/" });
        await setSessionCookie();
        return { ok: true as const };
    } catch {
        return { ok: false, status: 400 as const, error: "verification-failed" };
    }
}