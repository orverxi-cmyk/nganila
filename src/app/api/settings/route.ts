import { NextResponse } from "next/server";
import { getServerSetting, saveServerSetting } from "@/lib/server-settings-store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get("section") || "slider";
    const data = await getServerSetting(section);
    return NextResponse.json({ success: true, section, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { sectionId, content } = body;

    if (!sectionId || content === undefined) {
      return NextResponse.json({ success: false, error: "Missing sectionId or content" }, { status: 400 });
    }

    const saved = await saveServerSetting(sectionId, content);
    return NextResponse.json({ success: saved, sectionId, content });
  } catch (error: any) {
    console.error("[api/settings POST] Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

