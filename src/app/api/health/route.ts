import { NextResponse } from "next/server";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";

export const runtime = "nodejs";
export async function GET() { initializeSchema(getDatabase()); return NextResponse.json({ status: "ok", service: "markpath" }); }
