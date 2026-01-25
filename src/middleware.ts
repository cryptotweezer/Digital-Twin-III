import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import arcjet, { detectBot, shield, stack } from "@arcjet/next";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export async function middleware(req: NextRequest) {
  try {
    const ajKey = process.env.ARCJET_KEY;
    
    // FAIL-SAFE: Si no hay llave o es de prueba, saltamos el escudo
    if (!ajKey || ajKey === "aj_mock_key" || ajKey.length < 10) {
      return NextResponse.next();
    }

    const aj = arcjet({
      key: ajKey,
      characteristics: ["ip.src"],
      rules: [
        shield({ mode: "LIVE" }),
        detectBot({ mode: "LIVE", allow: ["CATEGORY:SEARCH_ENGINE"] }),
      ],
    });

    const decision = await aj.protect(req);

    if (decision.isDenied()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware Fail-Safe Triggered:", error);
    return NextResponse.next();
  }
}