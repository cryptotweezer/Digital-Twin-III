import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/next";
import { NextResponse } from "next/server";
import type { NextRequest, NextFetchEvent } from "next/server";

export const config = {
    // Matcher que ignora archivos estáticos, imágenes y favicon
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export async function middleware(req: NextRequest, ctx: NextFetchEvent) {
    try {
        // 1. Validación de Llave y Bypass de Seguridad
        const ajKey = process.env.ARCJET_KEY;

        // Válvula de seguridad: Si la llave falta, es corta o es la de prueba, 
        // saltamos el escudo para evitar que la web se caiga (Error 500).
        if (!ajKey || ajKey === "aj_mock_key" || ajKey.length < 10) {
            return NextResponse.next();
        }

        // 2. Inicialización "Perezosa" (Dentro del bloque try)
        // Esto evita que el middleware explote si Arcjet no puede arrancar.
        const aj = arcjet({
            key: ajKey,
            rules: [
                shield({ mode: "LIVE" }),
                detectBot({ mode: "LIVE", allow: [] }), // Bloquea todos los bots no autorizados
                slidingWindow({ mode: "LIVE", interval: "10m", max: 100 }),
            ],
        });

        // 3. Ejecución de la protección
        const decision = await aj.protect(req);

        // 4. Manejo de Bloqueos (Acceso denegado)
        if (decision.isDenied()) {
            return NextResponse.json(
                { 
                    error: "Active Defense Triggered", 
                    reason: decision.reason 
                },
                { status: 403 }
            );
        }

        // 5. Acceso Permitido - Inyectamos el Fingerprint en los headers
        const res = NextResponse.next();
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((decision as any).fingerprint) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            res.headers.set("x-arcjet-fingerprint", (decision as any).fingerprint);
        }
        
        return res;

    } catch (error) {
        // 6. Fail-Safe Absoluto: Prevención de caída total
        // Si el middleware falla internamente, permitimos que el usuario pase 
        // pero dejamos rastro en los logs de Vercel para investigar.
        console.error("Critical Middleware Failure (Fail-Safe Triggered):", error);
        return NextResponse.next();
    }
}