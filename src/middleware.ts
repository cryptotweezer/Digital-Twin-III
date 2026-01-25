import arcjet, { createMiddleware, detectBot, shield, slidingWindow } from "@arcjet/next";
import { NextResponse, NextRequest, NextFetchEvent } from "next/server";
import { logSecurityEvent } from "@/lib/security";

export const config = {
    // Matcher que ignora archivos estáticos y del sistema
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

// Configuración de Arcjet
const aj = arcjet({
    key: process.env.ARCJET_KEY || "aj_mock_key",
    rules: [
        shield({
            mode: "LIVE",
        }),
        detectBot({
            mode: "LIVE",
            allow: [],
        }),
        slidingWindow({
            mode: "LIVE",
            interval: "10m",
            max: 100,
        }),
    ],
});

// @ts-ignore - Salto de error de tipos conocido en el middleware de Arcjet con Next.js 15/16
export default createMiddleware(aj, async (req: NextRequest, ctx: NextFetchEvent, next: any) => {
    const decision = await aj.protect(req);

    // Extracción segura del fingerprint
    const fingerprint = typeof (decision as any).fingerprint === 'string'
        ? (decision as any).fingerprint
        : "unknown";

    if (decision.isDenied()) {
        let eventType: "Bot" | "RateLimit" | "SQLi" | "AccessControl" = "AccessControl";
        let riskScore = 10;

        if (decision.reason.isBot()) {
            eventType = "Bot";
            riskScore = 30;
        } else if (decision.reason.isRateLimit()) {
            eventType = "RateLimit";
            riskScore = 20;
        } else if (decision.reason.isShield()) {
            eventType = "SQLi";
            riskScore = 50;
        }

        // Lógica de Telemetría Blindada
        try {
            // CORRECCIÓN PARA VERCEL: Convertimos el objeto IP de Arcjet a String plano
            const ipAddress = decision.ip ? String(decision.ip) : "127.0.0.1";

            await logSecurityEvent({
                fingerprint: fingerprint,
                eventType,
                riskScore,
                action: "Blocked",
                ip: ipAddress,
                location: "Unknown",
                payload: req.url,
            });
        } catch (e) {
            console.error("Middleware Logging Error:", e);
        }

        return NextResponse.json(
            { error: "Active Defense Triggered", reason: decision.reason },
            { status: 403 }
        );
    }

    // Petición Permitida - Inyectar header para que la App reconozca al usuario
    const res = await next();
    if (res instanceof NextResponse) {
        res.headers.set("x-arcjet-fingerprint", fingerprint);
    }
    return res;
});