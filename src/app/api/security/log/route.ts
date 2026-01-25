
import { NextRequest, NextResponse } from "next/server";
import { logSecurityEvent } from "@/lib/security";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Validate body minimally (optional but good practice)
        if (!body.fingerprint || !body.eventType) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        // Call the shared logic which handles DB connection, Session creation, and Event Logging
        // This runs in a Serverless Function (Node.js), not Edge (unless configured otherwise), 
        // shielding the Middleware from heavy DB dependencies.
        await logSecurityEvent({
            fingerprint: body.fingerprint,
            eventType: body.eventType,
            riskScore: body.riskScore,
            action: body.action,
            ip: body.ip,
            payload: body.payload || "unknown",
            location: body.location || "Unknown",
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Telemetry API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
