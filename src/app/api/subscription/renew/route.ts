import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    ok: true,
    message: "Obuna yangilash endpoint",
  });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Obuna holati",
  });
}