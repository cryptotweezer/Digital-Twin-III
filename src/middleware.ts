import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/next";
import { NextResponse } from "next/server";
import type { NextRequest, NextFetchEvent } from "next/server";

export const config = {
    // Matcher ignoring _next/static, _next/image, favicon.ico, etc.
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export async function middleware(req: NextRequest, ctx: NextFetchEvent) {
    // 1. Extreme Key Validation
    const ajKey = process.env.ARCJET_KEY;
    if (!ajKey || ajKey === 'aj_mock_key' || ajKey.length < 10) {
        // console.log("Middleware Bypass: No valid ARCJET_KEY found.");
        return NextResponse.next();
    }

    try {
        // 2. Instantiate Arcjet INSIDE middleware (Total Isolation)
        const aj = arcjet({
            key: ajKey,
            rules: [
                shield({ mode: "LIVE" }),
                detectBot({ mode: "LIVE", allow: [] }),
                slidingWindow({ mode: "LIVE", interval: "10m", max: 100 }),
            ],
        });

        const decision = await aj.protect(req);

        // Extracción segura del fingerprint
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fingerprint = typeof (decision as any).fingerprint === 'string'
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ? (decision as any).fingerprint
            : "unknown";

        if (decision.isDenied()) {
            /* 
            // 3. Telemetry Commented out temporarily
            const ipAddress = decision.ip ? String(decision.ip) : "127.0.0.1";
            ctx.waitUntil(
                fetch(new URL('/api/security/log', req.url), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'Blocked', ip: ipAddress })
                }).catch(e => console.error("Telemetry Error:", e))
            );
            */

            return NextResponse.json(
                { error: "Active Defense Triggered", reason: decision.reason },
                { status: 403 }
            );
        }

        const res = NextResponse.next();
        res.headers.set("x-arcjet-fingerprint", fingerprint);
        return res;

    } catch (error) {
        console.error("Middleware Error:", error);
        return NextResponse.next();
    }
}