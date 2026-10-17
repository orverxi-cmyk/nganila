import { NextResponse } from "next/server";
import { type EmailBlock } from "@/lib/email-template-compiler";
import {
  getActiveServerEmailTemplate,
  saveActiveServerEmailTemplate,
} from "@/lib/server-publications-store";

export interface TemplateRequestBody {
  name?: string;
  subject?: string;
  message?: string;
  mode?: "text" | "html";
  blocks?: EmailBlock[];
  userEmail?: string;
  coverImage?: string;
}

export async function GET() {
  try {
    const template = getActiveServerEmailTemplate();
    return NextResponse.json({
      success: true,
      template,
    });
  } catch (err: any) {
    console.error("[api/email/template GET] Error:", err?.message);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to retrieve template." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    let body: TemplateRequestBody = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON payload." },
        { status: 400 }
      );
    }

    const {
      name,
      subject,
      message = "",
      mode = "html",
      blocks = [],
      userEmail = "admin@sanex.rw",
      coverImage,
    } = body;

    // Persist custom email template & update the corresponding website publication
    const result = saveActiveServerEmailTemplate({
      name: name || subject,
      subject: subject || name,
      message,
      mode,
      blocks,
      userEmail,
      coverImage,
    });

    return NextResponse.json({
      success: true,
      template: result.template,
      publication: result.publication,
      publicationUrl: `/publications/${result.publication.slug}`,
      publicationSlug: result.publication.slug,
      message: "Custom email template and website publication synchronized successfully.",
    });
  } catch (error: any) {
    console.error("[api/email/template POST] Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to sync template." },
      { status: 500 }
    );
  }
}

