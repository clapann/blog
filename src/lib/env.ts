let validated = false;

export function validateRequiredEnv(): void {
    if (validated) return;

    const required = [
        "MONGODB_URI",
        "IP_HASH_SALT",
        "WEBAUTHN_COOKIE_SECRET",
        "WEBAUTHN_ORIGIN",
        "WEBAUTHN_RP_ID",
        "WEBAUTHN_RP_NAME",
        "WEBAUTHN_PASSKEY_TTL"
    ];

    const missing = required.filter((key) => !process.env[key] || String(process.env[key]).length === 0);
    if (missing.length > 0) {
        console.error(
            `Missing required environment variables: ${missing.join(", ")}.\n` +
            `Please set them in your environment or .env file.\n` +
            `The application cannot start without these.`
        );

        if (typeof process !== "undefined" && typeof process.exit === "function") {
            process.exit(1);
        }
    }

    validated = true;
}