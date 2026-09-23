import { NextResponse } from "next/server";

/** Discovery only. User memory lives in browser storage in this prototype. */
export function GET() {
  return NextResponse.json({
    name: "YOU Context Protocol",
    version: "0.1.0-proposal",
    status: "design-preview",
    dataEndpoint: null,
    transport: ["HTTP API (planned)", "MCP adapter (planned)"],
    modelNeutral: true,
    scopes: ["people.read", "preferences.read", "routines.read", "plans.read", "wellbeing.read", "insights.read", "memory.write"],
    rules: ["explicit grants", "source provenance", "uncertainty preserved", "private and excluded facts withheld", "revocable access", "auditable reads"],
    note: "This route describes the proposed boundary. No user data or live integration is exposed by this prototype.",
  });
}
