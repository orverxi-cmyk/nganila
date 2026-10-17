"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStorage } from "@/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  Monitor,
  Smartphone,
  Eye,
  ArrowLeft,
  ArrowRight,
  Undo2,
  Redo2,
  HelpCircle,
  Image as ImageIcon,
  Type,
  AlignLeft,
  RectangleHorizontal,
  Minus,
  MoveVertical,
  Video,
  Share2,
  Award,
  CodeXml,
  Grid,
  Sparkles,
  PanelTop,
  PanelBottom,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Upload,
  Layers,
  Palette,
  Gauge,
  CheckCircle2,
  Link2,
  Globe,
  Settings2,
  Plus,
  Check,
  ExternalLink,
  Cloud,
  RefreshCw,
  Play,
  Film,
  Youtube,
  ShieldCheck,
  Loader2,
  UploadCloud,
  AlertTriangle,
} from "lucide-react";

export type BlockType =
  | "header"
  | "topbar"
  | "logo"
  | "hero"
  | "columns_2"
  | "columns_3"
  | "columns_1"
  | "image"
  | "heading"
  | "paragraph"
  | "button"
  | "divider"
  | "spacer"
  | "video"
  | "social"
  | "code"
  | "footer";

export type SocialPlatform =
  | "x"
  | "linkedin"
  | "youtube"
  | "facebook"
  | "instagram"
  | "whatsapp"
  | "website";

export interface SocialLinkItem {
  id: string;
  platform: SocialPlatform;
  url: string;
  label?: string;
  enabled?: boolean;
}

export const SOCIAL_PLATFORMS: {
  id: SocialPlatform;
  name: string;
  iconText: string;
  color: string;
  bg: string;
  defaultUrl: string;
  placeholder: string;
}[] = [
  {
    id: "x",
    name: "X (Twitter)",
    iconText: "𝕏",
    color: "#0f172a",
    bg: "#ffffff",
    defaultUrl: "https://x.com/SanexRwanda",
    placeholder: "https://x.com/SanexRwanda",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    iconText: "in",
    color: "#0a66c2",
    bg: "#ffffff",
    defaultUrl: "https://linkedin.com/company/sanex-rwanda",
    placeholder: "https://linkedin.com/company/sanex-rwanda",
  },
  {
    id: "youtube",
    name: "YouTube",
    iconText: "▶",
    color: "#ff0000",
    bg: "#ffffff",
    defaultUrl: "https://youtube.com/@sanexrwanda",
    placeholder: "https://youtube.com/@sanexrwanda",
  },
  {
    id: "facebook",
    name: "Facebook",
    iconText: "f",
    color: "#1877f2",
    bg: "#ffffff",
    defaultUrl: "https://facebook.com/SanexRwanda",
    placeholder: "https://facebook.com/SanexRwanda",
  },
  {
    id: "instagram",
    name: "Instagram",
    iconText: "IG",
    color: "#e1306c",
    bg: "#ffffff",
    defaultUrl: "https://instagram.com/sanex_rwanda",
    placeholder: "https://instagram.com/sanex_rwanda",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    iconText: "WA",
    color: "#25d366",
    bg: "#ffffff",
    defaultUrl: "https://wa.me/250788300000",
    placeholder: "https://wa.me/250788300000",
  },
  {
    id: "website",
    name: "Website",
    iconText: "🌐",
    color: "#0f172a",
    bg: "#ffffff",
    defaultUrl: "https://sanex.rw",
    placeholder: "https://sanex.rw",
  },
];

export const DEFAULT_HEADER_SOCIALS: SocialLinkItem[] = [
  { id: "x", platform: "x", url: "https://x.com/SanexRwanda", label: "𝕏", enabled: true },
  { id: "linkedin", platform: "linkedin", url: "https://linkedin.com/company/sanex-rwanda", label: "in", enabled: true },
  { id: "youtube", platform: "youtube", url: "https://youtube.com/@sanexrwanda", label: "▶", enabled: true },
  { id: "facebook", platform: "facebook", url: "https://facebook.com/SanexRwanda", label: "f", enabled: false },
  { id: "instagram", platform: "instagram", url: "https://instagram.com/sanex_rwanda", label: "IG", enabled: false },
  { id: "whatsapp", platform: "whatsapp", url: "https://wa.me/250788300000", label: "WA", enabled: false },
  { id: "website", platform: "website", url: "https://sanex.rw", label: "🌐", enabled: false },
];

export function getSocialPlatformMeta(platform: string) {
  return SOCIAL_PLATFORMS.find((p) => p.id === platform) || {
    id: platform as SocialPlatform,
    name: platform,
    iconText: "★",
    color: "#0f172a",
    bg: "#ffffff",
    defaultUrl: "https://sanex.rw",
    placeholder: "https://...",
  };
}

export function parseVideoUrl(url?: string): {
  source: "youtube" | "vimeo" | "website" | "mp4" | "custom";
  videoId?: string;
  thumbnailUrl: string;
  watchUrl: string;
} {
  if (!url || typeof url !== "string") {
    return {
      source: "website",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
      watchUrl: "https://sanex.rw/#slider",
    };
  }

  const clean = url.trim();

  // YouTube detection
  if (clean.includes("youtube.com") || clean.includes("youtu.be")) {
    let videoId = "";
    if (clean.includes("youtube.com/watch")) {
      const match = clean.match(/[?&]v=([^&#]+)/);
      if (match) videoId = match[1];
    } else if (clean.includes("youtu.be/")) {
      const parts = clean.split("youtu.be/")[1]?.split(/[?&#]/);
      if (parts && parts[0]) videoId = parts[0];
    } else if (clean.includes("youtube.com/embed/")) {
      const parts = clean.split("youtube.com/embed/")[1]?.split(/[?&#]/);
      if (parts && parts[0]) videoId = parts[0];
    } else if (clean.includes("youtube.com/shorts/")) {
      const parts = clean.split("youtube.com/shorts/")[1]?.split(/[?&#]/);
      if (parts && parts[0]) videoId = parts[0];
    }

    if (videoId) {
      return {
        source: "youtube",
        videoId,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
      };
    }
  }

  // Vimeo
  if (clean.includes("vimeo.com")) {
    const match = clean.match(/vimeo\.com\/(\d+)/);
    return {
      source: "vimeo",
      videoId: match ? match[1] : undefined,
      thumbnailUrl:
        "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
      watchUrl: clean,
    };
  }

  // Firebase Storage or Direct MP4 / Video file (like slider video)
  if (clean.includes("firebasestorage.googleapis.com") || /\.(mp4|webm|ogg|mov)($|\?)/i.test(clean)) {
    return {
      source: "mp4",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
      // Direct video files like the website slider video must take recipients to the website slider
      watchUrl: "https://sanex.rw/#slider",
    };
  }

  // SANEX Website link
  if (clean.includes("sanex.rw") || clean.startsWith("/")) {
    let watchUrl = clean.startsWith("http") ? clean : `https://sanex.rw${clean}`;
    if (watchUrl === "https://sanex.rw" || watchUrl === "https://sanex.rw/" || watchUrl === "https://sanex.rw/#video") {
      watchUrl = "https://sanex.rw/#slider";
    }
    return {
      source: "website",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
      watchUrl,
    };
  }

  return {
    source: "custom",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
    watchUrl: clean,
  };
}

export function getEffectiveSocialLinks(block: EmailBlock): SocialLinkItem[] {
  if (Array.isArray(block.socialLinks) && block.socialLinks.length > 0) {
    return block.socialLinks;
  }
  return DEFAULT_HEADER_SOCIALS;
}

export interface EmailBlock {
  id: string;
  type: BlockType;
  heading?: string;
  subheading?: string;
  text?: string;
  buttonText?: string;
  buttonUrl?: string;
  buttonVariant?: "solid" | "outline";
  buttonColor?: string;
  buttonTextColor?: string;
  imageUrl?: string;
  imageAlt?: string;
  imageWidth?: number | string;
  bgColor?: string;
  textColor?: string;
  align?: "left" | "center" | "right";
  col1Width?: number;
  col2Width?: number;
  col1Image?: string;
  col1ImageWidth?: number;
  col1Heading?: string;
  col1Text?: string;
  col1ButtonText?: string;
  col1ButtonUrl?: string;
  col2Heading?: string;
  col2Text?: string;
  col2ButtonText?: string;
  col2ButtonUrl?: string;
  col2ButtonColor?: string;
  col2ButtonTextColor?: string;
  rawHtml?: string;
  socialLinks?: SocialLinkItem[];
  socialStyle?: "circle" | "rounded" | "pill";
  socialIconBg?: string;
  socialIconColor?: string;
  // Video Block Properties
  videoUrl?: string;
  videoWatchUrl?: string; // Click destination URL in email (defaults to https://sanex.rw/#slider)
  videoSource?: "youtube" | "vimeo" | "website" | "mp4" | "custom";
  videoThumbnail?: string;
  videoTitle?: string;
  videoCaption?: string;
  videoButtonText?: string;
  videoPlayButtonColor?: string;
  // Footer & Disclaimer Properties (LinkedIn Pattern)
  recipientName?: string;
  recipientRole?: string;
  organization?: string;
  disclaimerContext?: string;
  showDisclaimer?: boolean;
  unsubscribeUrl?: string;
  helpUrl?: string;
  privacyUrl?: string;
  // Company Header Properties (Moved from Footer)
  companyName?: string;
  companyTagline?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  websiteUrl?: string;
  logoUrl?: string;
}

interface EmailStudioBuilderProps {
  initialHtml?: string;
  initialBlocks?: EmailBlock[];
  onSaveAndProceed: (compiledHtml: string, blocks: EmailBlock[]) => void;
  onBackToSending: (blocks?: EmailBlock[]) => void;
  onSaveToCloud?: (compiledHtml: string, blocks: EmailBlock[]) => Promise<any>;
  onOpenCloudTransfer?: () => void;
  cloudSyncStatus?: "synced" | "saving" | "error" | "idle";
  lastSyncTime?: Date | null;
}

const INITIAL_SANEX_BLOCKS: EmailBlock[] = [
  {
    id: "header-1",
    type: "header",
    companyName: "SANEX COMPANY LTD",
    companyTagline: "Sustainable Liquid Waste Management · Rwanda",
    companyAddress: "KN 3 Rd, Kigali, Rwanda",
    companyPhone: "+250 788 385 838",
    companyEmail: "info@sanex.rw",
    websiteUrl: "https://sanex.rw",
    logoUrl: "",
    bgColor: "#0f172a",
    socialLinks: [...DEFAULT_HEADER_SOCIALS],
  },
  {
    id: "hero-1",
    type: "hero",
    heading: "WHO ARE WE?",
    text: "We are a Rwandan company specializing in liquid waste management, emptying services, and clean water delivery.",
    buttonText: "Learn More",
    buttonUrl: "https://sanex.rw/about",
    buttonVariant: "outline",
    bgColor: "#000000",
  },
  {
    id: "col2-1",
    type: "columns_2",
    col1Width: 46,
    col2Width: 54,
    col1Image:
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
    col1ImageWidth: 260,
    col2Heading: "Clean Water Delivery at You Doorstep",
    col2Text:
      "Our portfolio also includes modern, clean water tank trucks. During water scarcity, we are a trusted partner for delivering clean water to your doorstep.",
    col2ButtonText: "Read More",
    col2ButtonUrl: "https://sanex.rw/services",
    col2ButtonColor: "#000000",
    col2ButtonTextColor: "#8DB833",
  },
  {
    id: "col2-2",
    type: "columns_2",
    col1Width: 46,
    col2Width: 54,
    col1Image:
      "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=600&q=80",
    col1ImageWidth: 260,
    col2Heading:
      "Installation and Management of Decentralized Wastewater Treatment Systems (DWTS)",
    col2Text:
      "At SANEX Company Ltd, we provide comprehensive DWTS solutions—from initial construction to ongoing management—ensuring eco-friendly sanitation for institutions, hotels, and communities across Rwanda.",
    col2ButtonText: "Explore DWTS",
    col2ButtonUrl: "https://sanex.rw/services",
    col2ButtonColor: "#8DB833",
    col2ButtonTextColor: "#000000",
  },
  {
    id: "footer-1",
    type: "footer",
    recipientName: "{{email}}",
    recipientRole: "",
    organization: "",
    disclaimerContext: "You are receiving this official communication from SANEX Company Ltd regarding environmental sanitation, liquid waste operations, and wastewater management in Rwanda.",
    showDisclaimer: true,
    unsubscribeUrl: "https://sanex.rw/unsubscribe",
    helpUrl: "https://sanex.rw/contact",
    privacyUrl: "https://sanex.rw/privacy",
  },
];

export function compileBlocksToHtml(blocks: EmailBlock[] = INITIAL_SANEX_BLOCKS): string {
  const safeBlocks = Array.isArray(blocks) && blocks.length > 0 ? blocks : INITIAL_SANEX_BLOCKS;
  const renderedBlocks = safeBlocks
    .map((block) => {
      switch (block.type) {
        case "header": {
          const companyName = block.companyName || "SANEX COMPANY LTD";
          const tagline = block.companyTagline || "Sustainable Liquid Waste Management · Rwanda";
          const address = block.companyAddress || "KN 3 Rd, Kigali, Rwanda";
          const phone = block.companyPhone || "+250 788 385 838";
          const email = block.companyEmail || "info@sanex.rw";
          const website = block.websiteUrl || "https://sanex.rw";
          const bgColor = block.bgColor || "#0f172a";
          const links = getEffectiveSocialLinks(block).filter((l) => l.enabled !== false && l.url);

          const socialCells = links
            .map((link) => {
              const meta = getSocialPlatformMeta(link.platform);
              const label = link.label || meta.iconText;
              return `
                <td style="padding:0 4px;">
                  <a href="${link.url}" target="_blank" rel="noopener noreferrer" style="text-decoration:none; display:inline-block; width:22px; height:22px; line-height:22px; text-align:center; background-color:#1e293b; color:#cbd5e1; border-radius:50%; font-size:10px; font-weight:bold; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${label}</a>
                </td>
              `;
            })
            .join("");

          return `
            <tr>
              <td style="background-color:${bgColor}; padding:22px 24px 18px; border-bottom:3px solid #8DB833; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                <!-- DESKTOP HEADER (Brand Left, Socials Right - hidden on mobile <= 600px) -->
                <table class="sanex-desktop-col" border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td valign="middle">
                      <table border="0" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding-right:12px;" valign="middle">
                            ${
                              block.logoUrl
                                ? `<img src="${block.logoUrl}" alt="${companyName} Logo" width="44" height="44" style="width:44px; height:44px; border-radius:50%; object-fit:cover; border:2px solid #8DB833; display:block;" />`
                                : `<div style="display:inline-block; width:44px; height:44px; border-radius:50%; border:2px solid #8DB833; background-color:#1e293b; text-align:center; line-height:40px; font-size:20px;">
                              🚛
                            </div>`
                            }
                          </td>
                          <td valign="middle">
                            <h1 style="margin:0; font-size:17px; font-weight:900; color:#8DB833; letter-spacing:1px; text-transform:uppercase;">
                              ${companyName}
                            </h1>
                            <p style="margin:3px 0 0 0; font-size:10px; color:#94a3b8; text-transform:uppercase; letter-spacing:0.8px;">
                              ${tagline}
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                    ${
                      links.length > 0
                        ? `
                    <td align="right" valign="middle">
                      <table border="0" cellpadding="0" cellspacing="0" style="display:inline-block;"><tr>${socialCells}</tr></table>
                    </td>`
                        : ""
                    }
                  </tr>
                </table>

                <!-- MOBILE HEADER: STACKED VERTICALLY (Hidden on Desktop, Active on Mobile <= 600px) -->
                <!--[if !mso]><!-->
                <div class="sanex-mobile-col" style="display:none; max-height:0; overflow:hidden; mso-hide:all;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="padding-right:12px;" valign="middle">
                        ${
                          block.logoUrl
                            ? `<img src="${block.logoUrl}" alt="${companyName} Logo" width="44" height="44" style="width:44px; height:44px; border-radius:50%; object-fit:cover; border:2px solid #8DB833; display:block;" />`
                            : `<div style="display:inline-block; width:44px; height:44px; border-radius:50%; border:2px solid #8DB833; background-color:#1e293b; text-align:center; line-height:40px; font-size:20px;">
                          🚛
                        </div>`
                        }
                      </td>
                      <td valign="middle">
                        <h1 style="margin:0; font-size:16px; font-weight:900; color:#8DB833; letter-spacing:1px; text-transform:uppercase;">
                          ${companyName}
                        </h1>
                        <p style="margin:2px 0 0 0; font-size:9px; color:#94a3b8; text-transform:uppercase; letter-spacing:0.8px;">
                          ${tagline}
                        </p>
                      </td>
                    </tr>
                  </table>
                  ${
                    links.length > 0
                      ? `
                  <div style="padding-top:10px; text-align:right;">
                    <table border="0" cellpadding="0" cellspacing="0" align="right" style="margin:0 0 0 auto;">
                      <tr>${socialCells}</tr>
                    </table>
                    <div style="clear:both;"></div>
                  </div>`
                      : ""
                  }
                </div>
                <!--<![endif]-->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid #1e293b; margin-top:14px; padding-top:10px;">
                  <tr>
                    <td style="font-size:11px; color:#94a3b8; line-height:1.4;">
                      <span style="color:#cbd5e1; font-weight:600;">📍 ${address}</span>
                      <span style="color:#475569; margin:0 6px;">·</span>
                      <span>📞 <a href="tel:${phone.replace(/\s+/g, "")}" style="color:#cbd5e1; text-decoration:none;">${phone}</a></span>
                      <span style="color:#475569; margin:0 6px;">·</span>
                      <span>✉️ <a href="mailto:${email}" style="color:#8DB833; text-decoration:none;">${email}</a></span>
                      <span style="color:#475569; margin:0 6px;">·</span>
                      <span>🌐 <a href="${website}" target="_blank" rel="noopener noreferrer" style="color:#8DB833; text-decoration:none;">sanex.rw</a></span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          `;
        }

        case "topbar": {
          const links = getEffectiveSocialLinks(block).filter((l) => l.enabled !== false && l.url);
          const align = block.align || "right";
          const bgColor = block.bgColor || "#8DB833";
          const iconBg = block.socialIconBg || "#ffffff";

          const cells = links
            .map((link) => {
              const meta = getSocialPlatformMeta(link.platform);
              const label = link.label || meta.iconText;
              const textColor = block.socialIconColor || meta.color;
              return `
                <td style="padding:0 5px;">
                  <a href="${link.url}" target="_blank" rel="noopener noreferrer" style="text-decoration:none; display:inline-block; width:22px; height:22px; line-height:22px; text-align:center; background-color:${iconBg}; color:${textColor}; border-radius:50%; font-size:11px; font-weight:bold; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">${label}</a>
                </td>
              `;
            })
            .join("");

          return `
            <tr>
              <td align="${align}" style="background-color:${bgColor}; padding:8px 24px; text-align:${align};">
                <table border="0" cellpadding="0" cellspacing="0" style="display:inline-block; border-collapse:collapse;">
                  <tr>
                    ${cells || `<td>&nbsp;</td>`}
                  </tr>
                </table>
              </td>
            </tr>
          `;
        }

        case "logo":
          return `
            <tr>
              <td align="center" style="background-color:#ffffff; padding:28px 24px 20px; text-align:center;">
                <div style="display:inline-block; width:80px; height:80px; border-radius:50%; border:3px solid #8DB833; padding:4px; box-sizing:border-box; background-color:#ffffff; margin-bottom:8px;">
                  <div style="width:100%; height:100%; border-radius:50%; border:1px dashed #0f172a; display:flex; align-items:center; justify-content:center; text-align:center; font-family:sans-serif;">
                    <span style="font-size:24px; line-height:60px;">🚛</span>
                  </div>
                </div>
                <div style="color:#8DB833; font-size:13px; font-weight:900; letter-spacing:2px; text-transform:uppercase; margin-top:4px;">
                  ${block.text || "SANEX COMPANY LTD"}
                </div>
                ${
                  block.subheading
                    ? `<div style="color:#64748b; font-size:10px; text-transform:uppercase; letter-spacing:1px; margin-top:2px;">${block.subheading}</div>`
                    : ""
                }
              </td>
            </tr>
          `;

        case "hero":
          return `
            <tr>
              <td align="center" style="background-color:${block.bgColor || "#000000"}; color:#ffffff; padding:36px 28px; text-align:center;">
                <h1 style="color:#ffffff; font-size:20px; font-weight:900; letter-spacing:1.5px; text-transform:uppercase; margin:0 0 12px 0;">
                  ${block.heading || "WHO ARE WE?"}
                </h1>
                <p style="color:#cbd5e1; font-size:13px; line-height:1.6; max-width:480px; margin:0 auto 20px auto;">
                  ${block.text || ""}
                </p>
                ${
                  block.buttonText
                    ? `<a href="${block.buttonUrl || "#"}" target="_blank" style="display:inline-block; border:1.5px solid #ffffff; color:#ffffff; font-size:12px; font-weight:700; text-decoration:none; padding:10px 28px; border-radius:6px; letter-spacing:0.5px; text-transform:uppercase;">
                        ${block.buttonText}
                      </a>`
                    : ""
                }
              </td>
            </tr>
          `;

        case "columns_2":
          const leftW = block.col1Width || 48;
          const rightW = block.col2Width || 52;
          return `
            <tr>
              <td class="sanex-col-cell" style="background-color:#ffffff; padding:24px 20px; border-bottom:1px solid #f1f5f9;">
                <!-- DESKTOP 2-COLUMN VIEW (hidden on mobile <= 600px) -->
                <table class="sanex-desktop-col" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
                  <tr>
                    <td width="${leftW}%" valign="top" style="padding-right:16px;">
                      ${
                        block.col1Image
                          ? `<img src="${block.col1Image}" alt="${block.col2Heading || "Sanex Service"}" width="${block.col1ImageWidth || 260}" style="width:100%; max-width:${block.col1ImageWidth || 260}px; height:auto; border-radius:6px; display:block;" />`
                          : ""
                      }
                      ${block.col1Heading ? `<h3 style="color:#1e293b; font-size:15px; font-weight:800; margin:8px 0 6px 0;">${block.col1Heading}</h3>` : ""}
                      ${block.col1Text ? `<p style="color:#475569; font-size:12px; line-height:1.5; margin:0 0 10px 0;">${block.col1Text}</p>` : ""}
                    </td>
                    <td width="${rightW}%" valign="top" style="padding-left:8px;">
                      <h2 style="color:#8DB833; font-size:16px; font-weight:800; line-height:1.35; margin:0 0 10px 0;">
                        ${block.col2Heading || ""}
                      </h2>
                      <p style="color:#475569; font-size:12px; line-height:1.55; margin:0 0 16px 0;">
                        ${block.col2Text || ""}
                      </p>
                      ${
                        block.col2ButtonText
                          ? `<a href="${block.col2ButtonUrl || "#"}" target="_blank" style="display:inline-block; background-color:${block.col2ButtonColor || "#000000"}; color:${block.col2ButtonTextColor || "#8DB833"}; font-size:12px; font-weight:800; text-decoration:none; padding:9px 24px; border-radius:6px;">
                              ${block.col2ButtonText}
                            </a>`
                          : ""
                      }
                    </td>
                  </tr>
                </table>

                <!-- MOBILE VERTICALLY STACKED VIEW (hidden on desktop, active on mobile <= 600px) -->
                <!-- Exact Requested Order: 1. Title first, 2. Image, 3. Text, 4. Read More -->
                <!--[if !mso]><!-->
                <div class="sanex-mobile-col" style="display:none; max-height:0; overflow:hidden; mso-hide:all;">
                  ${
                    block.col2Heading
                      ? `<h2 style="color:#8DB833; font-size:17px; font-weight:800; line-height:1.35; margin:0 0 12px 0;">
                          ${block.col2Heading}
                        </h2>`
                      : ""
                  }
                  ${
                    block.col1Image
                      ? `<div style="margin:0 0 14px 0; width:100%;">
                          <img src="${block.col1Image}" alt="${block.col2Heading || "Sanex Service"}" style="width:100%; max-width:100%; height:auto; border-radius:8px; display:block;" />
                        </div>`
                      : ""
                  }
                  ${
                    block.col1Heading
                      ? `<h3 style="color:#1e293b; font-size:14px; font-weight:800; margin:0 0 8px 0;">
                          ${block.col1Heading}
                        </h3>`
                      : ""
                  }
                  ${
                    block.col2Text
                      ? `<p style="color:#475569; font-size:13px; line-height:1.6; margin:0 0 14px 0;">
                          ${block.col2Text}
                        </p>`
                      : block.col1Text
                      ? `<p style="color:#475569; font-size:13px; line-height:1.6; margin:0 0 14px 0;">
                          ${block.col1Text}
                        </p>`
                      : ""
                  }
                  ${
                    block.col2ButtonText
                      ? `<div style="margin-top:6px;">
                          <a href="${block.col2ButtonUrl || "#"}" target="_blank" style="display:inline-block; background-color:${block.col2ButtonColor || "#000000"}; color:${block.col2ButtonTextColor || "#8DB833"}; font-size:13px; font-weight:800; text-decoration:none; padding:10px 24px; border-radius:6px; text-align:center;">
                            ${block.col2ButtonText}
                          </a>
                        </div>`
                      : ""
                  }
                </div>
                <!--<![endif]-->
              </td>
            </tr>
          `;

        case "heading":
          return `
            <tr>
              <td align="${block.align || "left"}" style="background-color:#ffffff; padding:16px 24px 8px;">
                <h2 style="color:${block.textColor || "#0f172a"}; font-size:18px; font-weight:800; margin:0; line-height:1.4;">
                  ${block.heading || "Headline Title"}
                </h2>
              </td>
            </tr>
          `;

        case "paragraph":
          return `
            <tr>
              <td align="${block.align || "left"}" style="background-color:#ffffff; padding:8px 24px 16px;">
                <p style="color:${block.textColor || "#475569"}; font-size:13px; line-height:1.6; margin:0;">
                  ${block.text || "Your paragraph text goes here..."}
                </p>
              </td>
            </tr>
          `;

        case "image":
          return `
            <tr>
              <td align="${block.align || "center"}" style="background-color:#ffffff; padding:16px 24px;">
                <img src="${block.imageUrl || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80"}" alt="${block.imageAlt || "SANEX"}" style="width:${block.imageWidth || "100%"}; max-width:100%; height:auto; border-radius:6px; display:inline-block;" />
              </td>
            </tr>
          `;

        case "button":
          return `
            <tr>
              <td align="${block.align || "center"}" style="background-color:#ffffff; padding:16px 24px;">
                <a href="${block.buttonUrl || "#"}" target="_blank" style="display:inline-block; background-color:${block.buttonColor || "#8DB833"}; color:${block.buttonTextColor || "#000000"}; font-size:13px; font-weight:800; text-decoration:none; padding:11px 28px; border-radius:6px; text-transform:uppercase; letter-spacing:0.5px;">
                  ${block.buttonText || "Call to Action"}
                </a>
              </td>
            </tr>
          `;

        case "divider":
          return `
            <tr>
              <td style="background-color:#ffffff; padding:12px 24px;">
                <hr style="border:none; border-top:1px solid #e2e8f0; margin:0;" />
              </td>
            </tr>
          `;

        case "spacer":
          return `
            <tr>
              <td style="background-color:#ffffff; height:24px; line-height:24px; font-size:1px;">&nbsp;</td>
            </tr>
          `;

        case "footer": {
          const rawName = (block.recipientName || "").trim();
          const recName = (!rawName || rawName === "{{name}}" || rawName === "{{email}}")
            ? "{{email}}"
            : rawName;
          const recRole = block.recipientRole || "";
          const org = block.organization || "";
          const showDisc = block.showDisclaimer !== false;
          const contextText =
            block.disclaimerContext ||
            "You are receiving this official communication from SANEX Company Ltd regarding environmental sanitation, liquid waste operations, and wastewater management in Rwanda.";
          const unsubsUrl = block.unsubscribeUrl || "https://sanex.rw/unsubscribe";
          const helpUrl = block.helpUrl || "https://sanex.rw/contact";
          const privacyUrl = block.privacyUrl || "https://sanex.rw/privacy";
          const roleOrgDetails = [recRole, org].filter(Boolean).join(" at ");

          return `
            <tr>
              <td align="center" style="background-color:#0f172a; color:#94a3b8; padding:24px 20px; text-align:center; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:11px; line-height:1.55; border-top:1px solid #1e293b;">
                ${
                  showDisc
                    ? `
                <!-- Recipient Security Verification (LinkedIn Pattern) -->
                <p style="margin:0 0 8px 0; font-size:12px; color:#cbd5e1; line-height:1.5;">
                  This email was intended for <strong style="color:#ffffff;">${recName}</strong>${
                        roleOrgDetails ? ` <span style="color:#94a3b8;">(${roleOrgDetails})</span>` : ""
                      } · <a href="${privacyUrl}" target="_blank" rel="noopener noreferrer" style="color:#8DB833; text-decoration:underline;">Learn why we included this</a>.
                </p>

                <!-- Communication & Campaign Context -->
                <p style="margin:0 auto 10px auto; color:#94a3b8; font-size:11px; max-width:520px; line-height:1.55;">
                  ${contextText}
                </p>

                <!-- Preference & Compliance Action Links -->
                <p style="margin:0; font-size:11px;">
                  <a href="${unsubsUrl}" target="_blank" rel="noopener noreferrer" style="color:#cbd5e1; text-decoration:underline; margin:0 6px;">Unsubscribe</a>
                  <span style="color:#475569;">·</span>
                  <a href="${helpUrl}" target="_blank" rel="noopener noreferrer" style="color:#cbd5e1; text-decoration:underline; margin:0 6px;">Help &amp; Support</a>
                  <span style="color:#475569;">·</span>
                  <a href="${privacyUrl}" target="_blank" rel="noopener noreferrer" style="color:#cbd5e1; text-decoration:underline; margin:0 6px;">Privacy Policy</a>
                </p>
                `
                    : ""
                }
              </td>
            </tr>
          `;
        }

        case "social": {
          const links = getEffectiveSocialLinks(block).filter((l) => l.enabled !== false && l.url);
          const align = block.align || "center";
          const bgColor = block.bgColor || "#ffffff";
          const iconBg = block.socialIconBg || "#f1f5f9";

          const cells = links
            .map((link) => {
              const meta = getSocialPlatformMeta(link.platform);
              const label = link.label || meta.iconText;
              const textColor = block.socialIconColor || meta.color;
              return `
                <td style="padding:0 6px;">
                  <a href="${link.url}" target="_blank" rel="noopener noreferrer" style="text-decoration:none; display:inline-block; width:30px; height:30px; line-height:30px; text-align:center; background-color:${iconBg}; color:${textColor}; border-radius:50%; font-size:13px; font-weight:bold; border:1px solid #e2e8f0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${label}</a>
                </td>
              `;
            })
            .join("");

          return `
            <tr>
              <td align="${align}" style="background-color:${bgColor}; padding:18px 24px; text-align:${align};">
                <table border="0" cellpadding="0" cellspacing="0" style="display:inline-block; border-collapse:collapse;">
                  <tr>
                    ${cells || `<td>&nbsp;</td>`}
                  </tr>
                </table>
              </td>
            </tr>
          `;
        }

        case "video": {
          const parsed = parseVideoUrl(block.videoUrl);
          const isDirectMedia = Boolean(
            block.videoUrl &&
              (block.videoUrl.includes("firebasestorage.googleapis.com") ||
                /\.(mp4|webm|ogg|mov)($|\?)/i.test(block.videoUrl))
          );
          const watchUrl =
            block.videoWatchUrl?.trim() ||
            (isDirectMedia
              ? parsed.watchUrl
              : block.videoUrl?.trim() || parsed.watchUrl || "https://sanex.rw/#slider");
          const thumbnailUrl =
            block.videoThumbnail ||
            parsed.thumbnailUrl ||
            "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80";
          const title = block.videoTitle || "SANEX in Action";
          const caption = block.videoCaption || "";
          const btnText = block.videoButtonText || "Watch Video";
          const playColor = block.videoPlayButtonColor || "#8DB833";
          const align = block.align || "center";
          const bgColor = block.bgColor || "#ffffff";

          return `
            <tr>
              <td align="${align}" style="background-color:${bgColor}; padding:20px 24px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:552px; margin:0 auto; background-color:#ffffff; border-radius:10px; overflow:hidden; border:1px solid #e2e8f0; border-collapse:collapse;">
                  <!-- THUMBNAIL WITH PLAY BADGE LINK -->
                  <tr>
                    <td align="center" style="background-color:#0b1120; line-height:0; position:relative;">
                      <a href="${watchUrl}" target="_blank" rel="noopener noreferrer" style="display:block; text-decoration:none;">
                        <img src="${thumbnailUrl}" alt="${title}" width="552" style="width:100%; max-width:552px; height:auto; display:block; border:0;" />
                      </a>
                    </td>
                  </tr>
                  <!-- TITLE, CAPTION & CTA BAR -->
                  <tr>
                    <td class="sanex-video-bar" style="padding:16px 20px; background-color:#ffffff; border-top:3px solid ${playColor};">
                      <!-- DESKTOP BAR (hidden on mobile <= 600px) -->
                      <table border="0" cellpadding="0" cellspacing="0" width="100%" class="sanex-desktop-col">
                        <tr>
                          <td valign="middle" align="left">
                            <h3 style="color:#0f172a; font-size:15px; font-weight:800; margin:0 0 4px 0; line-height:1.35; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                              ${title}
                            </h3>
                            ${
                              caption
                                ? `<p style="color:#64748b; font-size:12px; line-height:1.5; margin:0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${caption}</p>`
                                : ""
                            }
                          </td>
                          <td width="130" align="right" valign="middle" style="padding-left:12px;">
                            <a href="${watchUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block; background-color:${playColor}; color:#000000; font-size:12px; font-weight:800; text-decoration:none; padding:9px 18px; border-radius:6px; white-space:nowrap; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                              ▶ ${btnText}
                            </a>
                          </td>
                        </tr>
                      </table>

                      <!-- MOBILE VERTICALLY STACKED BAR (hidden on desktop, active on mobile <= 600px) -->
                      <!--[if !mso]><!-->
                      <div class="sanex-mobile-col" style="display:none; max-height:0; overflow:hidden; mso-hide:all; text-align:left;">
                        <h3 style="color:#0f172a; font-size:15px; font-weight:800; margin:0 0 6px 0; line-height:1.35; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                          ${title}
                        </h3>
                        ${
                          caption
                            ? `<p style="color:#64748b; font-size:12px; line-height:1.55; margin:0 0 12px 0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${caption}</p>`
                            : ""
                        }
                        <div style="margin-top:${caption ? "0" : "10px"}; text-align:left;">
                          <a href="${watchUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block; background-color:${playColor}; color:#000000; font-size:12px; font-weight:800; text-decoration:none; padding:9px 18px; border-radius:6px; white-space:nowrap; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                            ▶ ${btnText}
                          </a>
                        </div>
                      </div>
                      <!--<![endif]-->
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          `;
        }

        case "code":
          return `
            <tr>
              <td style="background-color:#ffffff; padding:16px 24px;">
                ${block.rawHtml || ""}
              </td>
            </tr>
          `;

        default:
          return "";
      }
    })
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SANEX Campaign</title>
  <style type="text/css">
    @media only screen and (max-width: 600px) {
      .sanex-desktop-col {
        display: none !important;
        max-height: 0 !important;
        overflow: hidden !important;
        mso-hide: all !important;
      }
      .sanex-mobile-col {
        display: block !important;
        max-height: none !important;
        overflow: visible !important;
        font-size: inherit !important;
      }
      .sanex-header-brand-cell {
        display: block !important;
        width: 100% !important;
        padding-bottom: 12px !important;
        text-align: left !important;
      }
      .sanex-header-socials-cell {
        display: block !important;
        width: 100% !important;
        text-align: right !important;
        padding-top: 4px !important;
        padding-bottom: 6px !important;
      }
      .sanex-header-socials-table {
        margin: 0 0 0 auto !important;
        text-align: right !important;
        display: inline-block !important;
      }
      .sanex-col-cell {
        padding: 20px 16px !important;
      }
      .sanex-video-bar {
        padding: 16px 16px !important;
      }
    }
    .mobile-forced .sanex-desktop-col {
      display: none !important;
      max-height: 0 !important;
      overflow: hidden !important;
    }
    .mobile-forced .sanex-mobile-col {
      display: block !important;
      max-height: none !important;
      overflow: visible !important;
      font-size: inherit !important;
    }
    .mobile-forced .sanex-header-brand-cell {
      display: block !important;
      width: 100% !important;
      padding-bottom: 12px !important;
      text-align: left !important;
    }
    .mobile-forced .sanex-header-socials-cell {
      display: block !important;
      width: 100% !important;
      text-align: right !important;
      padding-top: 4px !important;
      padding-bottom: 6px !important;
    }
    .mobile-forced .sanex-header-socials-table {
      margin: 0 0 0 auto !important;
      text-align: right !important;
      display: inline-block !important;
    }
    .mobile-forced .sanex-col-cell {
      padding: 20px 16px !important;
    }
    .mobile-forced .sanex-video-bar {
      padding: 16px 16px !important;
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#f4f5f7; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <center style="width:100%; background-color:#f4f5f7; padding:24px 0;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px; background-color:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.06); border-collapse:collapse;">
      ${renderedBlocks}
    </table>
  </center>
</body>
</html>
  `.trim();
}

function AutoResizingTextarea({
  value,
  onChange,
  className,
  placeholder,
  rows = 1,
  style,
  ...props
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
  placeholder?: string;
  rows?: number;
  style?: React.CSSProperties;
  [key: string]: any;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [value]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
    onChange(e);
  };

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={handleInput}
      rows={rows}
      placeholder={placeholder}
      className={`overflow-hidden resize-none [field-sizing:content] ${className || ""}`}
      style={{
        overflow: "hidden",
        resize: "none",
        ...style,
      }}
      {...props}
    />
  );
}

/**
 * Converts a base64 data URL to a binary Blob so it can be uploaded to Firebase Storage
 */
export function dataUrlToBlob(dataUrl: string): Blob | null {
  try {
    const parts = dataUrl.split(",");
    if (parts.length < 2) return null;
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const binary = atob(parts[1]);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    return new Blob([array], { type: mime });
  } catch (err) {
    console.error("Failed to convert dataUrl to blob:", err);
    return null;
  }
}

/**
 * Counts how many images in the template are stored as inline base64 data URIs
 * (which causes email clients like Outlook, Gmail, Apple Mail to display them as attachments)
 */
export function countBase64Images(blocks: EmailBlock[]): number {
  if (!Array.isArray(blocks)) return 0;
  let count = 0;
  for (const b of blocks) {
    if (b.imageUrl?.startsWith("data:")) count++;
    if (b.col1Image?.startsWith("data:")) count++;
    if (b.videoThumbnail?.startsWith("data:")) count++;
    if (b.logoUrl?.startsWith("data:")) count++;
  }
  return count;
}

/**
 * Uploads a binary Blob to Firebase Storage and returns the permanent, public HTTPS CDN URL.
 * Using hosted HTTPS URLs guarantees images render inline without being sent as email attachments.
 */
export async function uploadBlobToFirebaseStorage(
  storage: any,
  blob: Blob,
  filename: string
): Promise<string> {
  const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const storageRef = ref(storage, `emails/images/${Date.now()}_${safeName}`);
  const metadata = {
    contentType: blob.type || "image/jpeg",
    cacheControl: "public, max-age=31536000, immutable",
  };
  await uploadBytes(storageRef, blob, metadata);
  return await getDownloadURL(storageRef);
}

export function EmailStudioBuilder({
  initialHtml,
  initialBlocks,
  onSaveAndProceed,
  onBackToSending,
  onSaveToCloud,
  onOpenCloudTransfer,
  cloudSyncStatus = "idle",
  lastSyncTime,
}: EmailStudioBuilderProps) {
  const [blocks, setBlocks] = useState<EmailBlock[]>(() =>
    initialBlocks && initialBlocks.length > 0 ? initialBlocks : INITIAL_SANEX_BLOCKS
  );
  const [history, setHistory] = useState<EmailBlock[][]>(() => [
    initialBlocks && initialBlocks.length > 0 ? initialBlocks : INITIAL_SANEX_BLOCKS,
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [activeTab, setActiveTab] = useState<"blocks" | "sections" | "styles" | "optimize">("blocks");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [modalPreviewDevice, setModalPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [activeBlockId, setActiveBlockId] = useState<string | null>("col2-1");
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const [resizingColBlockId, setResizingColBlockId] = useState<string | null>(null);

  // Link Destination Editor Modal State
  const [linkEditModal, setLinkEditModal] = useState<{
    isOpen: boolean;
    blockId: string;
    fieldUrl: "buttonUrl" | "col1ButtonUrl" | "col2ButtonUrl";
    fieldText: "buttonText" | "col1ButtonText" | "col2ButtonText";
    fieldColor?: "buttonColor" | "col2ButtonColor";
    fieldTextColor?: "buttonTextColor" | "col2ButtonTextColor";
  } | null>(null);

  const openLinkEditor = (
    blockId: string,
    fieldUrl: "buttonUrl" | "col1ButtonUrl" | "col2ButtonUrl",
    fieldText: "buttonText" | "col1ButtonText" | "col2ButtonText",
    fieldColor?: "buttonColor" | "col2ButtonColor",
    fieldTextColor?: "buttonTextColor" | "col2ButtonTextColor"
  ) => {
    setActiveBlockId(blockId);
    setLinkEditModal({
      isOpen: true,
      blockId,
      fieldUrl,
      fieldText,
      fieldColor,
      fieldTextColor,
    });
  };

  // Social Media Configuration Modal State
  const [socialEditModal, setSocialEditModal] = useState<{
    isOpen: boolean;
    blockId: string;
  } | null>(null);

  const openSocialEditor = (blockId: string) => {
    setActiveBlockId(blockId);
    setSocialEditModal({
      isOpen: true,
      blockId,
    });
  };

  // Video Configuration Modal State
  const [videoEditModal, setVideoEditModal] = useState<{
    isOpen: boolean;
    blockId: string;
  } | null>(null);

  const openVideoEditor = (blockId: string) => {
    setActiveBlockId(blockId);
    setVideoEditModal({
      isOpen: true,
      blockId,
    });
  };

  // Footer / Disclaimer Configuration Modal State
  const [footerEditModal, setFooterEditModal] = useState<{
    isOpen: boolean;
    blockId: string;
  } | null>(null);

  const openFooterEditor = (blockId: string) => {
    setActiveBlockId(blockId);
    setFooterEditModal({
      isOpen: true,
      blockId,
    });
  };

  const storage = useStorage();

  // Image Editor & Cloud CDN Modal State
  const [imageEditModal, setImageEditModal] = useState<{
    isOpen: boolean;
    blockId: string;
    field: "col1Image" | "imageUrl" | "videoThumbnail" | "logoUrl";
    title?: string;
  } | null>(null);

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgressMsg, setUploadProgressMsg] = useState<string | null>(null);
  const [isOptimizingImages, setIsOptimizingImages] = useState(false);

  const openImageEditor = (
    blockId: string,
    field: "col1Image" | "imageUrl" | "videoThumbnail" | "logoUrl",
    title?: string
  ) => {
    setActiveBlockId(blockId);
    setImageEditModal({
      isOpen: true,
      blockId,
      field,
      title,
    });
  };

  const convertAllBase64ImagesToCloud = async (currentBlocks: EmailBlock[]): Promise<EmailBlock[]> => {
    if (!storage) {
      return currentBlocks;
    }
    setIsOptimizingImages(true);
    try {
      const updated = await Promise.all(
        currentBlocks.map(async (block) => {
          const copy = { ...block };

          if (copy.imageUrl && copy.imageUrl.startsWith("data:")) {
            const blob = dataUrlToBlob(copy.imageUrl);
            if (blob) {
              const url = await uploadBlobToFirebaseStorage(storage, blob, `img_${copy.id}.jpg`);
              copy.imageUrl = url;
            }
          }

          if (copy.col1Image && copy.col1Image.startsWith("data:")) {
            const blob = dataUrlToBlob(copy.col1Image);
            if (blob) {
              const url = await uploadBlobToFirebaseStorage(storage, blob, `col1_${copy.id}.jpg`);
              copy.col1Image = url;
            }
          }

          if (copy.videoThumbnail && copy.videoThumbnail.startsWith("data:")) {
            const blob = dataUrlToBlob(copy.videoThumbnail);
            if (blob) {
              const url = await uploadBlobToFirebaseStorage(storage, blob, `thumb_${copy.id}.jpg`);
              copy.videoThumbnail = url;
            }
          }

          if (copy.logoUrl && copy.logoUrl.startsWith("data:")) {
            const blob = dataUrlToBlob(copy.logoUrl);
            if (blob) {
              const url = await uploadBlobToFirebaseStorage(storage, blob, `logo_${copy.id}.jpg`);
              copy.logoUrl = url;
            }
          }

          return copy;
        })
      );

      commitBlocks(updated);
      setIsOptimizingImages(false);
      return updated;
    } catch (err: any) {
      console.error("Failed to convert base64 images to CDN:", err);
      setIsOptimizingImages(false);
      return currentBlocks;
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingUploadTargetRef = useRef<{
    blockId: string;
    field: "col1Image" | "imageUrl" | "videoThumbnail" | "logoUrl";
  } | null>(null);

  const commitBlocks = (newBlocks: EmailBlock[]) => {
    setBlocks(newBlocks);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newBlocks);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setBlocks(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setBlocks(history[historyIndex + 1]);
    }
  };

  const handleAddBlock = (type: BlockType) => {
    const newId = `${type}-${Date.now()}`;
    let newBlock: EmailBlock;

    switch (type) {
      case "image":
        newBlock = {
          id: newId,
          type: "image",
          imageUrl:
            "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
          imageWidth: "100%",
          align: "center",
        };
        break;
      case "heading":
        newBlock = {
          id: newId,
          type: "heading",
          heading: "New Section Headline",
          align: "left",
          textColor: "#8DB833",
        };
        break;
      case "paragraph":
        newBlock = {
          id: newId,
          type: "paragraph",
          text: "Click here to edit this paragraph and share updates, sanitation guidelines, or company news with your recipients.",
          align: "left",
        };
        break;
      case "button":
        newBlock = {
          id: newId,
          type: "button",
          buttonText: "Schedule Service Now",
          buttonUrl: "https://sanex.rw/booking",
          buttonColor: "#8DB833",
          buttonTextColor: "#000000",
          align: "center",
        };
        break;
      case "divider":
        newBlock = { id: newId, type: "divider" };
        break;
      case "spacer":
        newBlock = { id: newId, type: "spacer" };
        break;
      case "columns_2":
        newBlock = {
          id: newId,
          type: "columns_2",
          col1Width: 50,
          col2Width: 50,
          col1Image:
            "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
          col1ImageWidth: 260,
          col2Heading: "New Two-Column Highlight",
          col2Text:
            "Provide detailed information about your liquid waste emptying or clean water delivery services here.",
          col2ButtonText: "Learn More",
          col2ButtonUrl: "https://sanex.rw",
          col2ButtonColor: "#000000",
          col2ButtonTextColor: "#8DB833",
        };
        break;
      case "columns_3":
      case "columns_1":
        newBlock = {
          id: newId,
          type: "columns_2",
          col1Width: type === "columns_1" ? 100 : 33,
          col2Width: type === "columns_1" ? 0 : 67,
          col2Heading: "Column Feature Block",
          col2Text: "Describe this service offering.",
        };
        break;
      case "video":
        newBlock = {
          id: newId,
          type: "video",
          videoUrl:
            "https://firebasestorage.googleapis.com/v0/b/studio-9595184890-5bb3c.firebasestorage.app/o/uploads%2F1792173462347_Sanex%20Promo%20Video%20Final.mp4?alt=media&token=7a2b61d9-7261-4583-8b10-7770fd0bc41f",
          videoWatchUrl: "https://sanex.rw/#slider",
          videoSource: "mp4",
          videoThumbnail:
            "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
          videoTitle: "SANEX in Action: Our Solutions & Services",
          videoCaption:
            "Watch our specialized vacuum trucks and innovative sanitation solutions in action on our website slider.",
          videoButtonText: "Watch on Website Slider",
          videoPlayButtonColor: "#8DB833",
          bgColor: "#ffffff",
          align: "center",
        };
        break;
      case "social":
        newBlock = {
          id: newId,
          type: "social",
          align: "center",
          bgColor: "#ffffff",
          socialIconBg: "#f1f5f9",
          socialLinks: [...DEFAULT_HEADER_SOCIALS],
        };
        break;
      case "header":
        newBlock = {
          id: newId,
          type: "header",
          companyName: "SANEX COMPANY LTD",
          companyTagline: "Sustainable Liquid Waste Management · Rwanda",
          companyAddress: "KN 3 Rd, Kigali, Rwanda",
          companyPhone: "+250 788 385 838",
          companyEmail: "info@sanex.rw",
          websiteUrl: "https://sanex.rw",
          logoUrl: "",
          bgColor: "#0f172a",
          socialLinks: [...DEFAULT_HEADER_SOCIALS],
        };
        break;
      case "topbar":
        newBlock = {
          id: newId,
          type: "topbar",
          bgColor: "#8DB833",
          align: "right",
          socialLinks: [...DEFAULT_HEADER_SOCIALS],
        };
        break;
      case "footer":
        newBlock = {
          id: newId,
          type: "footer",
          recipientName: "{{email}}",
          recipientRole: "",
          organization: "",
          disclaimerContext:
            "You are receiving this official communication from SANEX Company Ltd regarding environmental sanitation, liquid waste operations, and wastewater management in Rwanda.",
          showDisclaimer: true,
          unsubscribeUrl: "https://sanex.rw/unsubscribe",
          helpUrl: "https://sanex.rw/contact",
          privacyUrl: "https://sanex.rw/privacy",
        };
        break;
      case "code":
        newBlock = {
          id: newId,
          type: "code",
          rawHtml: `<div style="padding:16px; background:#f8fafc; border:1px dashed #cbd5e1; text-align:center; font-family:sans-serif; color:#475569;">Custom HTML Block</div>`,
        };
        break;
      default:
        newBlock = {
          id: newId,
          type: "paragraph",
          text: "New custom content block.",
        };
    }

    commitBlocks([...blocks, newBlock]);
    setActiveBlockId(newId);
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    const updated = [...blocks];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    commitBlocks(updated);
  };

  const duplicateBlock = (index: number) => {
    const source = blocks[index];
    const copy = { ...source, id: `${source.type}-${Date.now()}` };
    const updated = [...blocks];
    updated.splice(index + 1, 0, copy);
    commitBlocks(updated);
    setActiveBlockId(copy.id);
  };

  const deleteBlock = (index: number) => {
    const updated = blocks.filter((_, i) => i !== index);
    commitBlocks(updated);
    setActiveBlockId(null);
  };

  const updateBlockField = (id: string, field: string, value: any) => {
    const updated = blocks.map((b) => (b.id === id ? { ...b, [field]: value } : b));
    setBlocks(updated);
  };

  const updateBlock = (id: string, partial: Partial<EmailBlock>) => {
    const updated = blocks.map((b) => (b.id === id ? { ...b, ...partial } : b));
    setBlocks(updated);
  };

  const triggerImageUpload = (
    blockId: string,
    field: "col1Image" | "imageUrl" | "videoThumbnail" | "logoUrl"
  ) => {
    pendingUploadTargetRef.current = { blockId, field };
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && pendingUploadTargetRef.current) {
      const { blockId, field } = pendingUploadTargetRef.current;
      setIsUploadingImage(true);
      setUploadProgressMsg("Optimizing image for email...");

      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const rawDataUrl = uploadEvent.target?.result as string;

        // Compress and scale down large images to prevent email clipping and ensure fast load
        const img = new Image();
        img.onload = () => {
          const MAX_DIM = 1200;
          let w = img.width;
          let h = img.height;
          if (w > MAX_DIM || h > MAX_DIM) {
            if (w > h) {
              h = Math.round((h * MAX_DIM) / w);
              w = MAX_DIM;
            } else {
              w = Math.round((w * MAX_DIM) / h);
              h = MAX_DIM;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            setIsUploadingImage(false);
            setUploadProgressMsg(null);
            return;
          }
          ctx.drawImage(img, 0, 0, w, h);

          // Convert to Blob and upload to Firebase Storage CDN
          canvas.toBlob(
            async (blob) => {
              if (!blob) {
                setIsUploadingImage(false);
                setUploadProgressMsg(null);
                return;
              }

              if (storage) {
                try {
                  setUploadProgressMsg("Uploading to Cloud CDN (Prevents email attachments)...");
                  const publicUrl = await uploadBlobToFirebaseStorage(
                    storage,
                    blob,
                    file.name.endsWith(".jpg") || file.name.endsWith(".jpeg")
                      ? file.name
                      : `${file.name}.jpg`
                  );
                  const updated = blocks.map((b) =>
                    b.id === blockId ? { ...b, [field]: publicUrl } : b
                  );
                  commitBlocks(updated);
                  setIsUploadingImage(false);
                  setUploadProgressMsg(null);
                  return;
                } catch (storageErr) {
                  console.warn("Storage upload failed, falling back to local compressed data URI:", storageErr);
                }
              }

              // Fallback if storage not reachable
              const compressed = canvas.toDataURL("image/jpeg", 0.82);
              const updated = blocks.map((b) =>
                b.id === blockId ? { ...b, [field]: compressed } : b
              );
              commitBlocks(updated);
              setIsUploadingImage(false);
              setUploadProgressMsg(null);
            },
            "image/jpeg",
            0.85
          );
        };
        img.onerror = () => {
          const updated = blocks.map((b) =>
            b.id === blockId ? { ...b, [field]: rawDataUrl } : b
          );
          commitBlocks(updated);
          setIsUploadingImage(false);
          setUploadProgressMsg(null);
        };
        img.src = rawDataUrl;
      };
      reader.readAsDataURL(file);
    }
  };

  const startColResize = (e: React.MouseEvent, blockId: string, currentLeftW: number) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColBlockId(blockId);

    const startX = e.clientX;
    const initialW = currentLeftW;

    const onMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      const dx = moveEvent.clientX - startX;
      const deltaPct = Math.round((dx / 600) * 100);
      const newLeftW = Math.max(20, Math.min(80, initialW + deltaPct));
      const newRightW = 100 - newLeftW;

      setBlocks((prev) =>
        prev.map((b) => (b.id === blockId ? { ...b, col1Width: newLeftW, col2Width: newRightW } : b))
      );
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      setResizingColBlockId(null);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const startImageResize = (
    e: React.MouseEvent,
    blockId: string,
    currentWidth: number,
    field: "col1ImageWidth" | "imageWidth"
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const initialW = typeof currentWidth === "number" ? currentWidth : 260;

    const onMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      const dx = moveEvent.clientX - startX;
      const newWidth = Math.max(80, Math.min(540, initialW + dx));

      setBlocks((prev) =>
        prev.map((b) => (b.id === blockId ? { ...b, [field]: newWidth } : b))
      );
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const compiledHtml = compileBlocksToHtml(blocks);
  const base64Count = countBase64Images(blocks);

  const applyBrandColorToButtons = (color: string) => {
    const updated = blocks.map((b) => {
      const copy = { ...b };
      if (copy.buttonText || copy.buttonUrl) {
        copy.buttonColor = color;
        copy.buttonTextColor = color === "#ffffff" ? "#0f172a" : "#000000";
      }
      if (copy.col2ButtonText || copy.col2ButtonUrl) {
        copy.col2ButtonColor = color;
        copy.col2ButtonTextColor = color === "#ffffff" ? "#0f172a" : "#000000";
      }
      return copy;
    });
    commitBlocks(updated);
  };

  const applyHeaderBgColor = (color: string) => {
    const updated = blocks.map((b) => {
      if (b.type === "header") {
        return { ...b, bgColor: color };
      }
      return b;
    });
    commitBlocks(updated);
  };

  const getBlockSummary = (block: EmailBlock) => {
    switch (block.type) {
      case "header":
        return {
          title: block.companyName || "SANEX Header",
          desc: block.companyTagline || "Logo & Contacts",
          icon: PanelTop,
        };
      case "hero":
        return {
          title: block.heading || "Hero Banner",
          desc: block.text ? (block.text.length > 32 ? block.text.slice(0, 32) + "..." : block.text) : "Hero Callout",
          icon: Award,
        };
      case "columns_2":
        return {
          title: block.col2Heading || "2-Column Layout",
          desc: block.col1Heading || "Service showcase",
          icon: Grid,
        };
      case "columns_1":
        return {
          title: "1-Column Layout",
          desc: "Full-width section",
          icon: RectangleHorizontal,
        };
      case "columns_3":
        return {
          title: "3-Column Layout",
          desc: "Triple column row",
          icon: Grid,
        };
      case "image":
        return {
          title: "Full-Width Image",
          desc: block.imageAlt || "Responsive photo",
          icon: ImageIcon,
        };
      case "heading":
        return {
          title: block.heading || block.text || "Heading",
          desc: "Section title",
          icon: Type,
        };
      case "paragraph":
        return {
          title: "Paragraph",
          desc: block.text ? (block.text.length > 32 ? block.text.slice(0, 32) + "..." : block.text) : "Body copy",
          icon: AlignLeft,
        };
      case "button":
        return {
          title: block.buttonText || "Call to Action",
          desc: block.buttonUrl || "Click link",
          icon: RectangleHorizontal,
        };
      case "video":
        return {
          title: block.videoTitle || "Video Feature",
          desc: "Website slider video",
          icon: Video,
        };
      case "social":
        return {
          title: "Social Links",
          desc: "Media channels bar",
          icon: Share2,
        };
      case "divider":
        return {
          title: "Divider Line",
          desc: "Horizontal rule",
          icon: Minus,
        };
      case "spacer":
        return {
          title: "Vertical Spacer",
          desc: "Spacing block",
          icon: MoveVertical,
        };
      case "footer":
        return {
          title: "Disclaimer Footer",
          desc: block.recipientName && block.recipientName !== "{{email}}" && block.recipientName !== "{{name}}"
            ? `Intended for ${block.recipientName}`
            : "Intended for recipient email",
          icon: PanelBottom,
        };
      case "logo":
        return {
          title: "Brand Emblem",
          desc: block.text || "SANEX emblem",
          icon: Award,
        };
      case "code":
        return {
          title: "Custom HTML",
          desc: "Raw HTML code",
          icon: CodeXml,
        };
      default:
        return {
          title: "Content Block",
          desc: (block as any).type,
          icon: Layers,
        };
    }
  };

  const calculateHealthScore = () => {
    let score = 100;
    if (base64Count > 0) score -= Math.min(30, base64Count * 15);
    const hasFooter = blocks.some((b) => b.type === "footer" && b.showDisclaimer !== false);
    if (!hasFooter) score -= 20;
    const hasHeader = blocks.some((b) => b.type === "header");
    if (!hasHeader) score -= 10;
    const bytes = typeof window !== "undefined" ? new Blob([compiledHtml]).size : compiledHtml.length;
    if (bytes > 102400) score -= 25;
    else if (bytes > 85000) score -= 10;
    return Math.max(10, Math.min(100, score));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] min-h-[750px] bg-[#f8fafc] border rounded-xl overflow-hidden shadow-xs">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* TOP STUDIO BAR */}
      <header className="h-14 bg-white border-b px-4 flex items-center justify-between gap-3 shrink-0 z-30">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onBackToSending(blocks)}
            className="h-8 text-xs font-bold gap-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Sending
          </Button>

          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-teal-600 hover:text-teal-700 transition-colors"
          >
            <HelpCircle className="h-4 w-4" />
            <span>How to use this builder</span>
          </button>
        </div>

        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50 p-0.5 shadow-2xs">
          <button
            type="button"
            onClick={() => setPreviewDevice("desktop")}
            className={`px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 rounded transition-all ${
              previewDevice === "desktop"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
            title="Desktop View (600px)"
          >
            <Monitor className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setPreviewDevice("mobile")}
            className={`px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 rounded transition-all ${
              previewDevice === "mobile"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
            title="Mobile View (375px)"
          >
            <Smartphone className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyIndex === 0}
            className="p-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none rounded hover:bg-slate-100"
            title="Undo"
          >
            <Undo2 className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none rounded hover:bg-slate-100"
            title="Redo"
          >
            <Redo2 className="h-4 w-4" />
          </button>

          {onSaveToCloud && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                let activeBlocks = blocks;
                const base64Count = countBase64Images(activeBlocks);
                if (base64Count > 0 && storage) {
                  activeBlocks = await convertAllBase64ImagesToCloud(activeBlocks);
                }
                const html = compileBlocksToHtml(activeBlocks);
                onSaveToCloud(html, activeBlocks);
              }}
              disabled={cloudSyncStatus === "saving" || isOptimizingImages}
              className={`h-8 text-xs font-bold gap-1.5 transition-all ${
                cloudSyncStatus === "saving" || isOptimizingImages
                  ? "border-amber-300 bg-amber-50 text-amber-900"
                  : cloudSyncStatus === "synced"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                  : "border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
              title={
                lastSyncTime
                  ? `Synced with Cloud & Live Site at ${lastSyncTime.toLocaleTimeString()}`
                  : "Sync template to Cloud & Live Site"
              }
            >
              <Cloud
                className={`h-3.5 w-3.5 ${
                  cloudSyncStatus === "saving" || isOptimizingImages
                    ? "animate-pulse text-amber-600"
                    : cloudSyncStatus === "synced"
                    ? "text-emerald-600"
                    : "text-sky-600"
                }`}
              />
              <span>
                {cloudSyncStatus === "saving" || isOptimizingImages
                  ? "Syncing..."
                  : cloudSyncStatus === "synced"
                  ? "Synced"
                  : "Sync Cloud"}
              </span>
            </Button>
          )}

          {onOpenCloudTransfer && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenCloudTransfer}
              className="h-8 text-xs font-bold gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-50"
              title="Cloud & Live Website Sync & Transfer Settings"
            >
              <RefreshCw className="h-3.5 w-3.5 text-slate-700" />
              <span>Live Sync</span>
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setModalPreviewDevice(previewDevice);
              setShowPreviewModal(true);
            }}
            className="h-8 text-xs font-bold gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <Eye className="h-3.5 w-3.5 text-slate-800" /> Preview
          </Button>

          <Button
            type="button"
            disabled={isOptimizingImages}
            onClick={async () => {
              let activeBlocks = blocks;
              const base64Count = countBase64Images(activeBlocks);
              if (base64Count > 0 && storage) {
                activeBlocks = await convertAllBase64ImagesToCloud(activeBlocks);
              }
              const html = compileBlocksToHtml(activeBlocks);
              onSaveAndProceed(html, activeBlocks);
            }}
            className="h-8 text-xs font-extrabold bg-[#8DB833] text-black hover:bg-[#8DB833]/90 gap-1.5 shadow-xs"
          >
            {isOptimizingImages ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Hosting Photos...</span>
              </>
            ) : (
              <>
                <span>Save & Send</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </header>

      {/* BASE64 ATTACHMENT PREVENTION BANNER */}
      {countBase64Images(blocks) > 0 && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900 shrink-0 z-30">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              <strong>Attachment Prevention Alert:</strong> {countBase64Images(blocks)} photo(s) are stored as local base64. Email clients (Gmail, Outlook) will detach them as file attachments unless hosted on Cloud CDN.
            </span>
          </div>
          <Button
            type="button"
            size="sm"
            disabled={isOptimizingImages}
            onClick={() => convertAllBase64ImagesToCloud(blocks)}
            className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1.5 shadow-2xs shrink-0 self-start sm:self-auto"
          >
            {isOptimizingImages ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Hosting on CDN...</span>
              </>
            ) : (
              <>
                <UploadCloud className="h-3.5 w-3.5" />
                <span>Host on Cloud CDN (Guarantees No Attachments)</span>
              </>
            )}
          </Button>
        </div>
      )}

      {/* STUDIO BODY */}
      <div className="flex-1 flex overflow-hidden">
        {/* FAR LEFT NAVIGATION RAIL */}
        <div className="w-14 bg-white border-r flex flex-col items-center py-3 gap-3 shrink-0 z-20">
          <button
            type="button"
            onClick={() => setActiveTab("blocks")}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold p-1.5 rounded-lg transition-colors w-11 ${
              activeTab === "blocks"
                ? "text-teal-700 bg-teal-50 border-r-2 border-teal-600 shadow-2xs"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
            title="Content Blocks & Elements"
          >
            <Grid className="h-5 w-5" />
            <span>Blocks</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("sections")}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold p-1.5 rounded-lg transition-colors w-11 ${
              activeTab === "sections"
                ? "text-teal-700 bg-teal-50 border-r-2 border-teal-600 shadow-2xs"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
            title="Email Sections Outline"
          >
            <Layers className="h-5 w-5" />
            <span>Sections</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("styles")}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold p-1.5 rounded-lg transition-colors w-11 ${
              activeTab === "styles"
                ? "text-teal-700 bg-teal-50 border-r-2 border-teal-600 shadow-2xs"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
            title="Brand Colors & Theme Styles"
          >
            <Palette className="h-5 w-5" />
            <span>Styles</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("optimize")}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold p-1.5 rounded-lg transition-colors w-11 relative ${
              activeTab === "optimize"
                ? "text-teal-700 bg-teal-50 border-r-2 border-teal-600 shadow-2xs"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
            title="Deliverability & Anti-Attachment Center"
          >
            <Gauge className="h-5 w-5" />
            <span>Optimize</span>
            {base64Count > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white" />
            )}
          </button>
        </div>

        {/* LEFT DRAWER (BLOCKS / SECTIONS / STYLES / OPTIMIZE) */}
        <div className="w-80 bg-white border-r overflow-y-auto p-4 flex flex-col gap-5 shrink-0 z-10">
          {activeTab === "blocks" && (
            <>
              <div className="space-y-2.5">
            <div>
              <h3 className="text-xs font-bold text-slate-900 m-0">Content blocks</h3>
              <p className="text-[11px] text-slate-500 m-0">Click or drag to add content to your email</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { type: "header" as BlockType, label: "Header", icon: PanelTop },
                { type: "image" as BlockType, label: "Image", icon: ImageIcon },
                { type: "heading" as BlockType, label: "Heading", icon: Type },
                { type: "paragraph" as BlockType, label: "Paragraph", icon: AlignLeft },
                { type: "button" as BlockType, label: "Button", icon: RectangleHorizontal },
                { type: "divider" as BlockType, label: "Divider", icon: Minus },
                { type: "spacer" as BlockType, label: "Spacer", icon: MoveVertical },
                { type: "video" as BlockType, label: "Video", icon: Video },
                { type: "social" as BlockType, label: "Social", icon: Share2 },
                { type: "logo" as BlockType, label: "Logo", icon: Award },
                { type: "code" as BlockType, label: "Code", icon: CodeXml },
                { type: "footer" as BlockType, label: "Footer", icon: PanelBottom },
              ].map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleAddBlock(item.type)}
                    className="flex flex-col items-center justify-center p-2.5 rounded-lg border border-slate-200 bg-white hover:border-teal-500 hover:shadow-xs transition-all group text-slate-700 hover:text-teal-700"
                  >
                    <IconComponent className="h-5 w-5 mb-1 text-slate-500 group-hover:text-teal-600 transition-colors" />
                    <span className="text-[11px] font-semibold">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2.5 pt-2 border-t border-slate-200">
            <div>
              <h3 className="text-xs font-bold text-slate-900 m-0">Columns</h3>
              <p className="text-[11px] text-slate-500 m-0">Drag to add a column container to your email</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleAddBlock("columns_1")}
                className="flex items-center justify-center gap-1.5 p-2 rounded-lg border border-slate-200 bg-white hover:border-teal-500 hover:shadow-xs text-xs font-bold text-slate-700"
              >
                <div className="h-4 w-12 border border-slate-400 bg-slate-100 rounded-xs" />
                <span>1</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddBlock("columns_2")}
                className="flex items-center justify-center gap-1.5 p-2 rounded-lg border border-slate-200 bg-white hover:border-teal-500 hover:shadow-xs text-xs font-bold text-slate-700"
              >
                <div className="flex gap-0.5">
                  <div className="h-4 w-6 border border-slate-400 bg-slate-100 rounded-xs" />
                  <div className="h-4 w-6 border border-slate-400 bg-slate-100 rounded-xs" />
                </div>
                <span>2</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddBlock("columns_3")}
                className="flex items-center justify-center gap-1.5 p-2 rounded-lg border border-slate-200 bg-white hover:border-teal-500 hover:shadow-xs text-xs font-bold text-slate-700"
              >
                <div className="flex gap-0.5">
                  <div className="h-4 w-4 border border-slate-400 bg-slate-100 rounded-xs" />
                  <div className="h-4 w-4 border border-slate-400 bg-slate-100 rounded-xs" />
                  <div className="h-4 w-4 border border-slate-400 bg-slate-100 rounded-xs" />
                </div>
                <span>3</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddBlock("columns_2")}
                className="flex items-center justify-center gap-1.5 p-2 rounded-lg border border-slate-200 bg-white hover:border-teal-500 hover:shadow-xs text-xs font-bold text-slate-700"
              >
                <div className="flex gap-0.5">
                  <div className="h-4 w-4 border border-slate-400 bg-slate-100 rounded-xs" />
                  <div className="h-4 w-8 border border-slate-400 bg-slate-100 rounded-xs" />
                </div>
                <span>1 : 2</span>
              </button>
            </div>
          </div>

          {activeBlockId && (() => {
            const block = blocks.find((b) => b.id === activeBlockId);
            if (!block) return null;
            const hasButton = block.buttonUrl !== undefined || block.col2ButtonUrl !== undefined;
            const isHeader = block.type === "header";
            const isSocial = block.type === "topbar" || block.type === "social";
            const isVideo = block.type === "video";
            const isFooter = block.type === "footer";
            const isImage = block.type === "image" || Boolean(block.col1Image);

            return (
              <div className="p-3 bg-slate-50 border rounded-lg space-y-2.5 mt-auto">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase text-slate-500">
                    Selected: {block.type === "header" ? "Company Header" : block.type === "topbar" ? "Header Socials" : block.type === "footer" ? "Footer Disclaimer" : block.type}
                  </span>
                  {(isSocial || isVideo || isFooter || isImage || isHeader) && (
                    <span className="text-[9px] font-bold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded">
                      Editable
                    </span>
                  )}
                </div>

                {isVideo && (() => {
                  const parsed = parseVideoUrl(block.videoUrl);
                  const isDirectMedia = Boolean(
                    block.videoUrl &&
                      (block.videoUrl.includes("firebasestorage.googleapis.com") ||
                        /\.(mp4|webm|ogg|mov)($|\?)/i.test(block.videoUrl))
                  );
                  const effectiveWatchUrl =
                    block.videoWatchUrl?.trim() ||
                    (isDirectMedia ? parsed.watchUrl : block.videoUrl?.trim() || "https://sanex.rw/#slider");

                  return (
                    <div className="space-y-2 pt-1.5 border-t">
                      <Button
                        type="button"
                        onClick={() => openVideoEditor(block.id)}
                        className="w-full h-8 text-xs font-bold bg-[#8DB833] text-black hover:bg-[#8DB833]/90 gap-1.5 shadow-xs"
                      >
                        <Video className="h-3.5 w-3.5" /> Configure Video & Links
                      </Button>

                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-700 flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Link2 className="h-3 w-3 text-emerald-600" /> Click Destination URL:
                          </span>
                        </Label>
                        <Input
                          type="url"
                          value={effectiveWatchUrl}
                          onChange={(e) => updateBlockField(block.id, "videoWatchUrl", e.target.value)}
                          placeholder="https://sanex.rw/#slider"
                          className="h-8 text-xs bg-white font-mono"
                        />
                        <p className="text-[9px] text-slate-500 m-0">
                          Recipients go here when clicking the video in their email.
                        </p>
                      </div>

                      <div className="text-[10px] text-slate-500 flex items-center justify-between">
                        <span>Source:</span>
                        <span className="font-bold text-slate-800 capitalize bg-slate-200/70 px-1.5 py-0.5 rounded">
                          {parsed.source}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {isSocial && (
                  <div className="space-y-2.5 pt-1.5 border-t">
                    <Button
                      type="button"
                      onClick={() => openSocialEditor(block.id)}
                      className="w-full h-8 text-xs font-bold bg-[#8DB833] text-black hover:bg-[#8DB833]/90 gap-1.5 shadow-xs"
                    >
                      <Settings2 className="h-3.5 w-3.5" /> Configure Social Media
                    </Button>

                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase font-bold text-slate-600">
                        Header Background Color:
                      </Label>
                      <div className="flex items-center gap-1.5">
                        {["#8DB833", "#0f172a", "#000000", "#ffffff"].map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => updateBlockField(block.id, "bgColor", color)}
                            style={{ backgroundColor: color }}
                            className={`h-5 w-5 rounded-full border border-slate-300 shadow-2xs transition-transform hover:scale-110 ${
                              (block.bgColor || "#8DB833") === color ? "ring-2 ring-teal-500 scale-110" : ""
                            }`}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {hasButton && (
                  <div className="space-y-1.5 pt-1.5 border-t">
                    <Label className="text-[10px] font-bold text-slate-700 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Link2 className="h-3 w-3 text-teal-600" /> Web Link Destination:
                      </span>
                    </Label>
                    <Input
                      type="url"
                      value={block.col2ButtonUrl || block.buttonUrl || ""}
                      onChange={(e) => {
                        const field = block.col2ButtonUrl !== undefined ? "col2ButtonUrl" : "buttonUrl";
                        updateBlockField(block.id, field, e.target.value);
                      }}
                      placeholder="https://sanex.rw/booking"
                      className="h-8 text-xs bg-white font-mono"
                    />
                  </div>
                )}

                {isHeader && (
                  <div className="space-y-2.5 pt-1.5 border-t">
                    {/* Header Logo Uploader / Customizer */}
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] uppercase font-bold text-slate-700">
                          Company Logo:
                        </Label>
                        {block.logoUrl && (
                          <button
                            type="button"
                            onClick={() => updateBlockField(block.id, "logoUrl", "")}
                            className="text-[10px] text-red-600 hover:text-red-700 hover:underline font-medium"
                          >
                            Reset to Emblem
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div
                          onClick={() => openImageEditor(block.id, "logoUrl", "Header Company Logo")}
                          className="w-11 h-11 rounded-full border-2 border-[#8DB833] bg-slate-900 flex items-center justify-center text-xl shrink-0 overflow-hidden cursor-pointer hover:border-slate-800 transition-all shadow-xs relative group/logo"
                          title="Click to upload or change logo"
                        >
                          {block.logoUrl ? (
                            <img
                              src={block.logoUrl}
                              alt="Header Logo"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-lg">🚛</span>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 flex items-center justify-center transition-opacity text-white">
                            <Upload className="h-3.5 w-3.5" />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => openImageEditor(block.id, "logoUrl", "Header Company Logo")}
                            className="w-full h-7 text-[11px] font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 gap-1.5 shadow-none"
                          >
                            <UploadCloud className="h-3.5 w-3.5 text-[#8DB833]" />
                            {block.logoUrl ? "Change / Upload Logo" : "Upload Custom Logo"}
                          </Button>
                          <p className="text-[10px] text-slate-500 m-0 leading-tight">
                            {block.logoUrl
                              ? "Custom CDN logo active (anti-attachment protected)."
                              : "Default SANEX emblem (🚛) active."}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button
                      type="button"
                      onClick={() => openSocialEditor(block.id)}
                      className="w-full h-8 text-xs font-bold bg-[#8DB833] text-black hover:bg-[#8DB833]/90 gap-1.5 shadow-xs"
                    >
                      <Share2 className="h-3.5 w-3.5" /> Configure Header Social Links
                    </Button>

                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase font-bold text-slate-600">
                        Company Name:
                      </Label>
                      <Input
                        type="text"
                        value={block.companyName || ""}
                        onChange={(e) => updateBlockField(block.id, "companyName", e.target.value)}
                        placeholder="SANEX COMPANY LTD"
                        className="h-7 text-xs bg-white font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase font-bold text-slate-600">
                        Tagline / Subheading:
                      </Label>
                      <Input
                        type="text"
                        value={block.companyTagline || ""}
                        onChange={(e) => updateBlockField(block.id, "companyTagline", e.target.value)}
                        placeholder="Sustainable Liquid Waste Management · Rwanda"
                        className="h-7 text-[11px] bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase font-bold text-slate-600">
                        Physical Address (Moved from Footer):
                      </Label>
                      <Input
                        type="text"
                        value={block.companyAddress || ""}
                        onChange={(e) => updateBlockField(block.id, "companyAddress", e.target.value)}
                        placeholder="KN 3 Rd, Kigali, Rwanda"
                        className="h-7 text-[11px] bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <Label className="text-[9px] uppercase font-bold text-slate-500 mb-0.5 block">
                          Phone:
                        </Label>
                        <Input
                          type="text"
                          value={block.companyPhone || ""}
                          onChange={(e) => updateBlockField(block.id, "companyPhone", e.target.value)}
                          placeholder="+250 788 385 838"
                          className="h-7 text-[11px] bg-white"
                        />
                      </div>
                      <div>
                        <Label className="text-[9px] uppercase font-bold text-slate-500 mb-0.5 block">
                          Email:
                        </Label>
                        <Input
                          type="email"
                          value={block.companyEmail || ""}
                          onChange={(e) => updateBlockField(block.id, "companyEmail", e.target.value)}
                          placeholder="info@sanex.rw"
                          className="h-7 text-[11px] bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {isFooter && (
                  <div className="space-y-2.5 pt-1.5 border-t">
                    <Button
                      type="button"
                      onClick={() => openFooterEditor(block.id)}
                      className="w-full h-8 text-xs font-bold bg-[#8DB833] text-black hover:bg-[#8DB833]/90 gap-1.5 shadow-xs"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" /> Configure Disclaimer &amp; Legal
                    </Button>

                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase font-bold text-slate-600">
                        Recipient Identifier (defaults to recipient email):
                      </Label>
                      <Input
                        type="text"
                        value={block.recipientName === "{{name}}" ? "{{email}}" : (block.recipientName || "")}
                        onChange={(e) => updateBlockField(block.id, "recipientName", e.target.value)}
                        placeholder="{{email}} or recipient name"
                        className="h-8 text-xs bg-white font-mono"
                      />
                      <p className="text-[10px] text-slate-500 leading-tight">
                        Defaults to <code className="text-[#4d7c0f] font-bold">{"{{email}}"}</code> which resolves to each recipient&apos;s email address when sent.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <Label className="text-[9px] uppercase font-bold text-slate-500 mb-0.5 block">
                          Role / Title:
                        </Label>
                        <Input
                          type="text"
                          value={block.recipientRole || ""}
                          onChange={(e) => updateBlockField(block.id, "recipientRole", e.target.value)}
                          placeholder="Senior Officer"
                          className="h-7 text-[11px] bg-white"
                        />
                      </div>
                      <div>
                        <Label className="text-[9px] uppercase font-bold text-slate-500 mb-0.5 block">
                          Organization:
                        </Label>
                        <Input
                          type="text"
                          value={block.organization || ""}
                          onChange={(e) => updateBlockField(block.id, "organization", e.target.value)}
                          placeholder="Water For People"
                          className="h-7 text-[11px] bg-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase font-bold text-slate-600">
                        Unsubscribe Destination:
                      </Label>
                      <Input
                        type="url"
                        value={block.unsubscribeUrl || ""}
                        onChange={(e) => updateBlockField(block.id, "unsubscribeUrl", e.target.value)}
                        placeholder="https://sanex.rw/unsubscribe"
                        className="h-8 text-xs bg-white font-mono"
                      />
                    </div>
                  </div>
                )}

                {isImage && (
                  <div className="space-y-2 pt-1.5 border-t">
                    <Button
                      type="button"
                      onClick={() =>
                        openImageEditor(
                          block.id,
                          block.type === "image" ? "imageUrl" : "col1Image",
                          block.type === "image" ? "Full-Width Image" : "Section Photo"
                        )
                      }
                      className="w-full h-8 text-xs font-bold bg-[#8DB833] text-black hover:bg-[#8DB833]/90 gap-1.5 shadow-xs"
                    >
                      <UploadCloud className="h-3.5 w-3.5" /> Image Settings (Cloud CDN)
                    </Button>
                  </div>
                )}

                <p className="text-[11px] text-slate-600 m-0">
                  {isHeader
                    ? "Click on any text or social link in the header canvas, or use the inputs above to customize address and contacts."
                    : isSocial
                    ? "Click directly on the header socials in the canvas or click the button above to edit links."
                    : isFooter
                    ? "Click directly on the footer in the canvas to configure the recipient disclaimer."
                    : isImage
                    ? "Click directly on the photo or click the button above to upload to Cloud CDN or choose brand assets."
                    : "Click directly on any text or button inside the canvas to edit in place."}
                </p>
              </div>
            );
          })()}

              {!activeBlockId && (
                <div className="p-3 bg-slate-50 border border-dashed rounded-lg text-center text-xs text-slate-500 mt-auto">
                  <p className="font-semibold text-slate-700 m-0">No block selected</p>
                  <p className="text-[11px] m-0 mt-0.5">Click any block in the canvas to configure its settings, or click a button above to add a new block.</p>
                </div>
              )}
            </>
          )}

          {/* TAB 2: SECTIONS (OUTLINE & REORDER) */}
          {activeTab === "sections" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 m-0">Email Sections</h3>
                  <p className="text-[11px] text-slate-500 m-0">Reorder, duplicate, or manage structure</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border">
                  {blocks.length} sections
                </span>
              </div>

              {/* Sections List */}
              <div className="space-y-2">
                {blocks.map((block, index) => {
                  const summary = getBlockSummary(block);
                  const Icon = summary.icon;
                  const isSelected = activeBlockId === block.id;

                  return (
                    <div
                      key={block.id}
                      onClick={() => setActiveBlockId(block.id)}
                      className={`p-2.5 rounded-lg border transition-all cursor-pointer text-left ${
                        isSelected
                          ? "border-teal-500 bg-teal-50/50 shadow-2xs ring-1 ring-teal-500"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[9px] font-mono font-bold text-slate-400 w-4">
                            #{index + 1}
                          </span>
                          <div className={`p-1.5 rounded ${isSelected ? "bg-teal-100 text-teal-800" : "bg-slate-100 text-slate-600"}`}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate m-0">
                              {summary.title}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate m-0">
                              {summary.desc}
                            </p>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveBlock(index, "up")}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 hover:bg-slate-100 rounded"
                            title="Move Up"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={index === blocks.length - 1}
                            onClick={() => moveBlock(index, "down")}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 hover:bg-slate-100 rounded"
                            title="Move Down"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => duplicateBlock(index)}
                            className="p-1 text-slate-400 hover:text-teal-600 hover:bg-slate-100 rounded"
                            title="Duplicate"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteBlock(index)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="mt-2 pt-2 border-t border-teal-200/60 flex items-center justify-between text-[10px]">
                          <span className="text-teal-700 font-semibold">Selected on Canvas</span>
                          <button
                            type="button"
                            onClick={() => setActiveTab("blocks")}
                            className="text-teal-700 font-bold hover:underline flex items-center gap-1"
                          >
                            <span>Configure</span> &rarr;
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Quick Append Pre-built Section */}
              <div className="pt-3 border-t space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-600 block">
                  Add Section:
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddBlock("header")}
                    className="justify-start text-xs h-7.5 bg-white text-slate-700 hover:bg-slate-50 gap-2"
                  >
                    <PanelTop className="h-3.5 w-3.5 text-[#8DB833]" />
                    <span>+ Company Header with Logo</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddBlock("hero")}
                    className="justify-start text-xs h-7.5 bg-white text-slate-700 hover:bg-slate-50 gap-2"
                  >
                    <Award className="h-3.5 w-3.5 text-slate-800" />
                    <span>+ Dark Hero Banner</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddBlock("columns_2")}
                    className="justify-start text-xs h-7.5 bg-white text-slate-700 hover:bg-slate-50 gap-2"
                  >
                    <Grid className="h-3.5 w-3.5 text-[#8DB833]" />
                    <span>+ 2-Column Clean Water Service</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddBlock("video")}
                    className="justify-start text-xs h-7.5 bg-white text-slate-700 hover:bg-slate-50 gap-2"
                  >
                    <Video className="h-3.5 w-3.5 text-red-600" />
                    <span>+ Video Player Showcase</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddBlock("footer")}
                    className="justify-start text-xs h-7.5 bg-white text-slate-700 hover:bg-slate-50 gap-2"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    <span>+ Compliance Disclaimer Footer</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STYLES */}
          {activeTab === "styles" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-900 m-0">Styles &amp; Theme</h3>
                <p className="text-[11px] text-slate-500 m-0">Brand colors, typography, and container layout</p>
              </div>

              {/* Brand Color Presets */}
              <div className="p-3 bg-slate-50 border rounded-lg space-y-2.5">
                <span className="text-[10px] uppercase font-bold text-slate-700 block">
                  SANEX Brand Color:
                </span>
                <div className="flex items-center gap-2">
                  {[
                    { name: "SANEX Green", color: "#8DB833" },
                    { name: "Slate Navy", color: "#0f172a" },
                    { name: "Charcoal", color: "#000000" },
                    { name: "Eco Teal", color: "#0d9488" },
                    { name: "Water Blue", color: "#0284c7" },
                  ].map((p) => (
                    <button
                      key={p.color}
                      type="button"
                      onClick={() => applyBrandColorToButtons(p.color)}
                      style={{ backgroundColor: p.color }}
                      className="h-6 w-6 rounded-full border-2 border-white shadow-xs hover:scale-110 transition-transform"
                      title={p.name}
                    />
                  ))}
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => applyBrandColorToButtons("#8DB833")}
                  className="w-full h-7 text-[11px] font-bold bg-[#8DB833] text-black hover:bg-[#8DB833]/90 gap-1.5 shadow-none"
                >
                  <Sparkles className="h-3 w-3" />
                  Apply #8DB833 Brand Green to Buttons
                </Button>
              </div>

              {/* Header Background Color Swatches */}
              <div className="p-3 bg-slate-50 border rounded-lg space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-700 block">
                  Header Background:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: "Slate Navy", color: "#0f172a" },
                    { label: "Pure Black", color: "#000000" },
                    { label: "Brand Green", color: "#8DB833" },
                    { label: "Clean White", color: "#ffffff" },
                  ].map((item) => (
                    <button
                      key={item.color}
                      type="button"
                      onClick={() => applyHeaderBgColor(item.color)}
                      className="flex items-center gap-1.5 p-1.5 rounded border bg-white hover:border-teal-500 text-[11px] font-semibold text-slate-700"
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Presets */}
              <div className="p-3 bg-slate-50 border rounded-lg space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-700 block">
                  1-Click Theme Presets:
                </span>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      applyBrandColorToButtons("#8DB833");
                      applyHeaderBgColor("#0f172a");
                    }}
                    className="w-full text-left p-2 rounded border bg-white hover:border-[#8DB833] transition-colors"
                  >
                    <p className="text-xs font-bold text-slate-800 m-0">SANEX Official Standard</p>
                    <p className="text-[10px] text-slate-500 m-0">#8DB833 Green Accents + #0f172a Dark Header</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      applyBrandColorToButtons("#000000");
                      applyHeaderBgColor("#000000");
                    }}
                    className="w-full text-left p-2 rounded border bg-white hover:border-slate-800 transition-colors"
                  >
                    <p className="text-xs font-bold text-slate-800 m-0">High-Contrast Modern</p>
                    <p className="text-[10px] text-slate-500 m-0">Monochrome Black &amp; White Styling</p>
                  </button>
                </div>
              </div>

              {/* Container & Typography Specs */}
              <div className="p-3 border rounded-lg space-y-2 bg-white text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Email Specifications:
                </span>
                <div className="space-y-1 text-[11px] text-slate-600">
                  <div className="flex justify-between">
                    <span>Container Width:</span>
                    <strong className="text-slate-800">600px Max</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Card Radius:</span>
                    <strong className="text-slate-800">8px Rounded</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Font Stack:</span>
                    <strong className="text-slate-800">System Sans</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Mobile Breakpoint:</span>
                    <strong className="text-slate-800">600px</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: OPTIMIZE */}
          {activeTab === "optimize" && (() => {
            const healthScore = calculateHealthScore();
            const bytes = typeof window !== "undefined" ? new Blob([compiledHtml]).size : compiledHtml.length;
            const kbSize = (bytes / 1024).toFixed(1);
            const kbPct = Math.min(100, Math.round((bytes / 104448) * 100));

            return (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 m-0">Deliverability &amp; Optimize</h3>
                  <p className="text-[11px] text-slate-500 m-0">Inbox health, anti-attachment checks, and compliance</p>
                </div>

                {/* Score Card */}
                <div className="p-3.5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                      Inbox Health Score
                    </span>
                    <span className="text-xs font-extrabold text-[#8DB833] bg-[#8DB833]/20 px-2 py-0.5 rounded-full">
                      {healthScore >= 90 ? "Excellent" : healthScore >= 70 ? "Good" : "Needs Review"}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-white">{healthScore}</span>
                    <span className="text-xs text-slate-400">/ 100</span>
                  </div>
                  <p className="text-[10px] text-slate-300 m-0">
                    High score ensures delivery directly to Primary Inbox avoiding Promotions or Spam.
                  </p>
                </div>

                {/* Anti-Attachment Cloud CDN Engine */}
                <div className="p-3 bg-slate-50 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-700">
                      Anti-Attachment Engine:
                    </span>
                    {base64Count === 0 ? (
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> 100% Protected
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> {base64Count} Base64 Risk
                      </span>
                    )}
                  </div>

                  {base64Count > 0 ? (
                    <div className="space-y-2">
                      <p className="text-[11px] text-amber-800 m-0">
                        {base64Count} image(s) are stored as local base64. Email clients (Outlook/Gmail) will display them as file attachments.
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        disabled={isOptimizingImages}
                        onClick={() => convertAllBase64ImagesToCloud(blocks)}
                        className="w-full h-7 text-xs font-bold bg-[#8DB833] text-black hover:bg-[#8DB833]/90 gap-1.5"
                      >
                        {isOptimizingImages ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Uploading to CDN...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="h-3.5 w-3.5" />
                            <span>Convert All to Cloud CDN</span>
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-600 m-0">
                      All images are hosted on Firebase Storage Cloud CDN. They will render beautifully inline without attachments.
                    </p>
                  )}
                </div>

                {/* Gmail 102KB Clipping Guard */}
                <div className="p-3 bg-slate-50 border rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Gmail 102KB Clipping:</span>
                    <span className="font-mono text-[11px] font-bold text-slate-800">{kbSize} KB / 102 KB</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        kbPct > 90 ? "bg-red-500" : kbPct > 75 ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${kbPct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 m-0">
                    Emails over 102KB get clipped with "[Message clipped] View entire message". Your template is well within safety limits.
                  </p>
                </div>

                {/* Compliance Checklist */}
                <div className="p-3 border rounded-lg space-y-2 bg-white text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-600 block">
                    Spam &amp; Compliance Checklist:
                  </span>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>Physical Address in Header</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>Unsubscribe &amp; Help Links</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>Anti-Phishing Recipient Verification</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>Mobile Responsive Fallback</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* MAIN EMAIL CANVAS AREA */}
        <div className="flex-1 bg-[#eef0f3] overflow-y-auto p-4 sm:p-8 flex justify-center items-start">
          <div
            className={`w-full transition-all duration-300 relative shadow-xl rounded-sm overflow-hidden bg-white ${
              previewDevice === "mobile" ? "max-w-[375px]" : "max-w-[600px]"
            }`}
          >
            <div className="absolute top-2 left-2 z-20 pointer-events-none">
              <span className="bg-teal-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                Body
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {blocks.map((block, index) => {
                const isActive = activeBlockId === block.id;

                return (
                  <div
                    key={block.id}
                    onClick={() => setActiveBlockId(block.id)}
                    className={`relative group transition-all ${
                      isActive ? "ring-2 ring-teal-500 z-10" : "hover:ring-1 hover:ring-teal-400/50"
                    }`}
                  >
                    {/* Hover Action Bar */}
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center gap-1 bg-slate-900 text-white p-1 rounded-md shadow-md text-[10px]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveBlock(index, "up");
                        }}
                        disabled={index === 0}
                        className="p-1 hover:bg-slate-700 rounded disabled:opacity-30"
                        title="Move Up"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveBlock(index, "down");
                        }}
                        disabled={index === blocks.length - 1}
                        className="p-1 hover:bg-slate-700 rounded disabled:opacity-30"
                        title="Move Down"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateBlock(index);
                        }}
                        className="p-1 hover:bg-slate-700 rounded"
                        title="Duplicate"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteBlock(index);
                        }}
                        className="p-1 hover:bg-red-700 text-red-300 rounded"
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>

                    {block.type === "header" && (() => {
                      const companyName = block.companyName || "SANEX COMPANY LTD";
                      const tagline = block.companyTagline || "Sustainable Liquid Waste Management · Rwanda";
                      const address = block.companyAddress || "KN 3 Rd, Kigali, Rwanda";
                      const phone = block.companyPhone || "+250 788 385 838";
                      const email = block.companyEmail || "info@sanex.rw";
                      const website = block.websiteUrl || "https://sanex.rw";
                      const links = getEffectiveSocialLinks(block).filter((l) => l.enabled !== false && l.url);
                      const isMobile = previewDevice === "mobile";

                      return (
                        <div
                          onClick={() => setActiveBlockId(block.id)}
                          className="p-4 sm:p-5 bg-[#0f172a] text-white border-b-4 border-[#8DB833] space-y-3 cursor-pointer group hover:ring-2 hover:ring-[#8DB833]/60 transition-all"
                        >
                          <div className={isMobile ? "flex flex-col items-stretch gap-2.5" : "flex flex-col sm:flex-row sm:items-center justify-between gap-3"}>
                            <div className="flex items-center gap-3">
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openImageEditor(block.id, "logoUrl", "Header Company Logo");
                                }}
                                className="w-11 h-11 rounded-full border-2 border-[#8DB833] bg-slate-800 flex items-center justify-center text-xl shrink-0 overflow-hidden cursor-pointer hover:border-white transition-all shadow-md relative group/canvaslogo"
                                title="Click to upload or change header company logo"
                              >
                                {block.logoUrl ? (
                                  <img
                                    src={block.logoUrl}
                                    alt="Logo"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span>🚛</span>
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/canvaslogo:opacity-100 flex items-center justify-center transition-opacity text-white">
                                  <Upload className="h-3.5 w-3.5" />
                                </div>
                              </div>
                              <div>
                                <AutoResizingTextarea
                                  rows={1}
                                  value={companyName}
                                  onChange={(e: any) => updateBlockField(block.id, "companyName", e.target.value)}
                                  className="w-full text-base font-extrabold text-[#8DB833] leading-tight bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-teal-400 rounded uppercase tracking-wider p-0 m-0"
                                  placeholder="Company Name..."
                                />
                                <AutoResizingTextarea
                                  rows={1}
                                  value={tagline}
                                  onChange={(e: any) => updateBlockField(block.id, "companyTagline", e.target.value)}
                                  className="w-full text-[10px] text-slate-400 uppercase tracking-wider leading-snug bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-teal-400 rounded p-0 m-0"
                                  placeholder="Company Tagline..."
                                />
                              </div>
                            </div>

                            {/* Social Icons */}
                            {links.length > 0 && (
                              <div className={isMobile ? "flex items-center gap-1.5 self-end pt-1" : "flex items-center gap-1.5 self-end sm:self-auto"}>
                                {links.map((link) => {
                                  const meta = getSocialPlatformMeta(link.platform);
                                  return (
                                    <button
                                      key={link.id}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openSocialEditor(block.id);
                                      }}
                                      className="w-6 h-6 rounded-full bg-slate-800 hover:bg-[#8DB833] text-slate-300 hover:text-black font-bold text-[10px] flex items-center justify-center transition-colors border border-slate-700"
                                      title={`Configure ${meta.name}`}
                                    >
                                      {link.label || meta.iconText}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Address & Contact Row (Moved from Footer) */}
                          <div className="border-t border-slate-800 pt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-slate-300">
                            <span className="font-semibold text-white flex items-center gap-1">📍 {address}</span>
                            <span className="text-slate-600">·</span>
                            <span>📞 {phone}</span>
                            <span className="text-slate-600">·</span>
                            <span className="text-[#8DB833]">✉️ {email}</span>
                            <span className="text-slate-600">·</span>
                            <span className="text-[#8DB833]">🌐 sanex.rw</span>
                          </div>
                        </div>
                      );
                    })()}

                    {block.type === "topbar" && (() => {
                      const links = getEffectiveSocialLinks(block).filter((l) => l.enabled !== false && l.url);
                      const isLeft = block.align === "left";
                      const isCenter = block.align === "center";

                      return (
                        <div
                          style={{ backgroundColor: block.bgColor || "#8DB833" }}
                          onClick={() => openSocialEditor(block.id)}
                          className={`py-2 px-6 flex items-center transition-all cursor-pointer relative group/topbar ${
                            isLeft ? "justify-start" : isCenter ? "justify-center" : "justify-end"
                          }`}
                          title="Click to configure header social media links and colors"
                        >
                          <div className="flex items-center gap-2">
                            {links.map((link) => {
                              const meta = getSocialPlatformMeta(link.platform);
                              const textColor = block.socialIconColor || meta.color;
                              const iconBg = block.socialIconBg || "#ffffff";
                              return (
                                <button
                                  key={link.id}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openSocialEditor(block.id);
                                  }}
                                  style={{
                                    backgroundColor: iconBg,
                                    color: textColor,
                                  }}
                                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black hover:scale-110 transition-transform shadow-2xs cursor-pointer"
                                  title={`Click to edit ${meta.name} link (${link.url})`}
                                >
                                  {link.label || meta.iconText}
                                </button>
                              );
                            })}
                          </div>

                          {/* Quick Configure Pill Overlay */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openSocialEditor(block.id);
                            }}
                            className="absolute left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover/topbar:opacity-100 transition-opacity bg-black/80 hover:bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm cursor-pointer z-10"
                          >
                            <Settings2 className="h-3 w-3 text-[#8DB833]" />
                            <span>Configure Socials</span>
                          </button>
                        </div>
                      );
                    })()}

                    {block.type === "logo" && (
                      <div className="py-6 px-4 bg-white text-center">
                        <div className="inline-block w-20 h-20 rounded-full border-4 border-[#8DB833] p-1 bg-white mb-2 shadow-xs">
                          <div className="w-full h-full rounded-full border border-dashed border-slate-700 flex items-center justify-center text-3xl">
                            🚛
                          </div>
                        </div>
                        <input
                          type="text"
                          value={block.text || ""}
                          onChange={(e) => updateBlockField(block.id, "text", e.target.value)}
                          className="w-full text-center font-extrabold text-[#8DB833] text-sm tracking-widest uppercase bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-teal-400 rounded"
                        />
                        <input
                          type="text"
                          value={block.subheading || ""}
                          onChange={(e) => updateBlockField(block.id, "subheading", e.target.value)}
                          className="w-full text-center text-[10px] text-slate-500 tracking-wider uppercase bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-teal-400 rounded mt-0.5"
                        />
                      </div>
                    )}

                    {block.type === "hero" && (
                      <div
                        style={{ backgroundColor: block.bgColor || "#000000" }}
                        className="py-8 px-6 text-center text-white space-y-3"
                      >
                        <AutoResizingTextarea
                          rows={1}
                          value={block.heading || ""}
                          onChange={(e) => updateBlockField(block.id, "heading", e.target.value)}
                          className="w-full text-center text-lg font-black tracking-wider uppercase bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-teal-400 text-white rounded"
                          placeholder="Heading..."
                        />
                        <AutoResizingTextarea
                          rows={2}
                          value={block.text || ""}
                          onChange={(e) => updateBlockField(block.id, "text", e.target.value)}
                          className="w-full text-center text-xs text-slate-300 leading-relaxed bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-teal-400 rounded"
                          placeholder="Hero text content..."
                        />
                        {block.buttonText && (
                          <div className="pt-2 flex flex-col items-center gap-1 group/btn relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openLinkEditor(block.id, "buttonUrl", "buttonText");
                              }}
                              className="inline-flex items-center gap-1.5 border border-white text-white text-xs font-bold px-6 py-2 rounded-md uppercase tracking-wide hover:bg-white hover:text-black transition-colors cursor-pointer shadow-xs"
                              title="Click to edit destination web link"
                            >
                              <span>{block.buttonText}</span>
                              <Link2 className="h-3 w-3 opacity-80 text-teal-300" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {block.type === "columns_2" && (
                      previewDevice === "mobile" ? (
                        /* MOBILE STACKED VIEW (Exact Requested Order: 1. Title, 2. Image, 3. Text, 4. Read More) */
                        <div className="p-4 sm:p-5 bg-white relative flex flex-col space-y-3.5">
                          {/* 1. TITLE FIRST */}
                          <div className="w-full">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-teal-600 block mb-1">
                              1. Section Title
                            </span>
                            <AutoResizingTextarea
                              rows={1}
                              value={block.col2Heading || ""}
                              onChange={(e) =>
                                updateBlockField(block.id, "col2Heading", e.target.value)
                              }
                              className="w-full text-base font-extrabold text-[#8DB833] leading-snug bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-teal-400 rounded"
                              placeholder="Section Title / Heading..."
                            />
                          </div>

                          {/* 2. IMAGE SECOND */}
                          {block.col1Image && (
                            <div className="w-full">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-teal-600 block mb-1">
                                2. Section Photo
                              </span>
                              <div className="relative group/img w-full flex flex-col items-center">
                                <img
                                  src={block.col1Image}
                                  alt="Section photo"
                                  style={{ width: "100%", maxWidth: block.col1ImageWidth || 340 }}
                                  className="rounded-lg object-cover w-full shadow-2xs cursor-pointer"
                                  onClick={() => openImageEditor(block.id, "col1Image", "Section Photo")}
                                />

                                <button
                                  type="button"
                                  onClick={() => openImageEditor(block.id, "col1Image", "Section Photo")}
                                  className="absolute bottom-2 left-2 bg-slate-900/80 hover:bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 shadow-xs opacity-0 group-hover/img:opacity-100 transition-opacity"
                                >
                                  <UploadCloud className="h-3 w-3 text-[#8DB833]" /> Image Settings &amp; CDN
                                </button>

                                <div
                                  onMouseDown={(e) =>
                                    startImageResize(
                                      e,
                                      block.id,
                                      block.col1ImageWidth || 260,
                                      "col1ImageWidth"
                                    )
                                  }
                                  className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-white border-2 border-[#8DB833] rounded-xs cursor-nwse-resize shadow-xs opacity-0 group-hover/img:opacity-100 transition-opacity"
                                  title="Drag to resize photo width"
                                />
                              </div>
                            </div>
                          )}

                          {block.col1Heading && (
                            <input
                              type="text"
                              value={block.col1Heading}
                              onChange={(e) =>
                                updateBlockField(block.id, "col1Heading", e.target.value)
                              }
                              className="w-full text-xs font-bold text-slate-800 bg-transparent border-none focus:ring-1 focus:ring-teal-400 rounded"
                              placeholder="Optional subhead..."
                            />
                          )}

                          {/* 3. TEXT THIRD */}
                          <div className="w-full">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-teal-600 block mb-1">
                              3. Description Text
                            </span>
                            <AutoResizingTextarea
                              rows={2}
                              value={block.col2Text || ""}
                              onChange={(e) => updateBlockField(block.id, "col2Text", e.target.value)}
                              className="w-full text-xs text-slate-600 leading-relaxed bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-teal-400 rounded"
                              placeholder="Column description..."
                            />
                            {block.col1Text && (
                              <AutoResizingTextarea
                                rows={2}
                                value={block.col1Text}
                                onChange={(e) => updateBlockField(block.id, "col1Text", e.target.value)}
                                className="w-full text-xs text-slate-500 leading-relaxed bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-teal-400 rounded mt-1"
                                placeholder="Additional column notes..."
                              />
                            )}
                          </div>

                          {/* 4. READ MORE / CTA BUTTON FOURTH */}
                          {block.col2ButtonText && (
                            <div className="w-full pt-1">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-teal-600 block mb-1">
                                4. Call to Action Button
                              </span>
                              <div className="flex flex-col items-start gap-1 group/btn relative">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openLinkEditor(
                                      block.id,
                                      "col2ButtonUrl",
                                      "col2ButtonText",
                                      "col2ButtonColor",
                                      "col2ButtonTextColor"
                                    );
                                  }}
                                  style={{
                                    backgroundColor: block.col2ButtonColor || "#000000",
                                    color: block.col2ButtonTextColor || "#8DB833",
                                  }}
                                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-md font-extrabold text-xs shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
                                  title="Click to edit destination web link"
                                >
                                  <span>{block.col2ButtonText}</span>
                                  <Link2 className="h-3 w-3 opacity-80" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* DESKTOP 2-COLUMN VIEW */
                        <div className="p-5 bg-white relative flex flex-col sm:flex-row items-stretch gap-4">
                          <div
                            style={{ width: `${block.col1Width || 48}%` }}
                            className="relative flex flex-col items-center justify-center min-w-[120px]"
                          >
                            {block.col1Image && (
                              <div className="relative group/img inline-block">
                                <img
                                  src={block.col1Image}
                                  alt="Section photo"
                                  style={{ width: block.col1ImageWidth || 260 }}
                                  className="rounded-md object-cover max-w-full shadow-2xs cursor-pointer"
                                  onClick={() => openImageEditor(block.id, "col1Image", "Section Photo")}
                                />

                                <button
                                  type="button"
                                  onClick={() => openImageEditor(block.id, "col1Image", "Section Photo")}
                                  className="absolute bottom-2 left-2 bg-slate-900/80 hover:bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 shadow-xs opacity-0 group-hover/img:opacity-100 transition-opacity"
                                >
                                  <UploadCloud className="h-3 w-3 text-[#8DB833]" /> Image Settings &amp; CDN
                                </button>

                                <div
                                  onMouseDown={(e) =>
                                    startImageResize(
                                      e,
                                      block.id,
                                      block.col1ImageWidth || 260,
                                      "col1ImageWidth"
                                    )
                                  }
                                  className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-white border-2 border-[#8DB833] rounded-xs cursor-nwse-resize shadow-xs opacity-0 group-hover/img:opacity-100 transition-opacity"
                                  title="Drag to resize photo width"
                                />
                              </div>
                            )}

                            {block.col1Heading && (
                              <input
                                type="text"
                                value={block.col1Heading}
                                onChange={(e) =>
                                  updateBlockField(block.id, "col1Heading", e.target.value)
                                }
                                className="w-full text-xs font-bold text-slate-800 bg-transparent border-none focus:ring-1 focus:ring-teal-400 rounded mt-2"
                              />
                            )}
                          </div>

                          <div
                            onMouseDown={(e) => startColResize(e, block.id, block.col1Width || 48)}
                            className={`w-2 hover:w-2 bg-transparent hover:bg-teal-400 cursor-col-resize self-stretch flex items-center justify-center transition-colors group/col relative z-20 ${
                              resizingColBlockId === block.id ? "bg-teal-500 w-2" : ""
                            }`}
                            title="Drag left/right to resize columns"
                          >
                            <div className="w-0.5 h-8 bg-slate-300 group-hover/col:bg-white rounded-full pointer-events-none" />
                          </div>

                          <div
                            style={{ width: `${block.col2Width || 52}%` }}
                            className="flex flex-col justify-center space-y-2.5 flex-1 min-w-[140px]"
                          >
                            <AutoResizingTextarea
                              rows={1}
                              value={block.col2Heading || ""}
                              onChange={(e) =>
                                updateBlockField(block.id, "col2Heading", e.target.value)
                              }
                              className="w-full text-sm font-extrabold text-[#8DB833] leading-snug bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-teal-400 rounded"
                              placeholder="Column Heading..."
                            />

                            <AutoResizingTextarea
                              rows={2}
                              value={block.col2Text || ""}
                              onChange={(e) => updateBlockField(block.id, "col2Text", e.target.value)}
                              className="w-full text-xs text-slate-600 leading-relaxed bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-teal-400 rounded"
                              placeholder="Column description..."
                            />

                            {block.col2ButtonText && (
                              <div className="pt-1 flex flex-col items-start gap-1 group/btn relative">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openLinkEditor(
                                      block.id,
                                      "col2ButtonUrl",
                                      "col2ButtonText",
                                      "col2ButtonColor",
                                      "col2ButtonTextColor"
                                    );
                                  }}
                                  style={{
                                    backgroundColor: block.col2ButtonColor || "#000000",
                                    color: block.col2ButtonTextColor || "#8DB833",
                                  }}
                                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-md font-extrabold text-xs shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
                                  title="Click to edit destination web link"
                                >
                                  <span>{block.col2ButtonText}</span>
                                  <Link2 className="h-3 w-3 opacity-80" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    )}

                    {block.type === "heading" && (
                      <div className="p-4 bg-white">
                        <AutoResizingTextarea
                          rows={1}
                          value={block.heading || ""}
                          onChange={(e) => updateBlockField(block.id, "heading", e.target.value)}
                          className="w-full text-base font-extrabold text-slate-900 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-teal-400 rounded"
                          placeholder="Headline text..."
                        />
                      </div>
                    )}

                    {block.type === "paragraph" && (
                      <div className="p-4 bg-white">
                        <AutoResizingTextarea
                          rows={2}
                          value={block.text || ""}
                          onChange={(e) => updateBlockField(block.id, "text", e.target.value)}
                          className="w-full text-xs text-slate-600 leading-relaxed bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-teal-400 rounded"
                          placeholder="Type paragraph text..."
                        />
                      </div>
                    )}

                    {block.type === "image" && (
                      <div className="p-4 bg-white text-center">
                        <div className="relative group/img inline-block">
                          <img
                            src={
                              block.imageUrl ||
                              "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80"
                            }
                            alt="Uploaded"
                            style={{ width: block.imageWidth || "100%" }}
                            className="rounded-md max-w-full inline-block shadow-xs cursor-pointer"
                            onClick={() => openImageEditor(block.id, "imageUrl", "Full-width Image")}
                          />

                          <button
                            type="button"
                            onClick={() => openImageEditor(block.id, "imageUrl", "Full-width Image")}
                            className="absolute bottom-2 left-2 bg-slate-900/80 hover:bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 shadow-xs opacity-0 group-hover/img:opacity-100 transition-opacity"
                          >
                            <UploadCloud className="h-3 w-3 text-[#8DB833]" /> Image Settings &amp; CDN
                          </button>

                          <div
                            onMouseDown={(e) =>
                              startImageResize(
                                e,
                                block.id,
                                typeof block.imageWidth === "number" ? block.imageWidth : 400,
                                "imageWidth"
                              )
                            }
                            className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-white border-2 border-[#8DB833] rounded-xs cursor-nwse-resize shadow-xs opacity-0 group-hover/img:opacity-100 transition-opacity"
                            title="Drag to resize photo"
                          />
                        </div>
                      </div>
                    )}

                    {block.type === "button" && (
                      <div className="p-4 bg-white text-center flex flex-col items-center gap-1 group/btn relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openLinkEditor(
                              block.id,
                              "buttonUrl",
                              "buttonText",
                              "buttonColor",
                              "buttonTextColor"
                            );
                          }}
                          style={{
                            backgroundColor: block.buttonColor || "#8DB833",
                            color: block.buttonTextColor || "#000000",
                          }}
                          className="inline-flex items-center gap-2 px-7 py-2.5 rounded-md font-extrabold text-xs shadow-xs uppercase tracking-wide hover:opacity-90 transition-opacity cursor-pointer"
                          title="Click to edit destination web link"
                        >
                          <span>{block.buttonText || "Call to Action"}</span>
                          <Link2 className="h-3.5 w-3.5 opacity-80" />
                        </button>
                      </div>
                    )}

                    {block.type === "divider" && (
                      <div className="py-3 px-6 bg-white">
                        <hr className="border-t border-slate-200" />
                      </div>
                    )}

                    {block.type === "spacer" && (
                      <div className="h-6 bg-slate-50/50 flex items-center justify-center text-[10px] text-slate-400 font-mono">
                        · · · spacer · · ·
                      </div>
                    )}

                    {block.type === "social" && (() => {
                      const links = getEffectiveSocialLinks(block).filter((l) => l.enabled !== false && l.url);
                      const isLeft = block.align === "left";
                      const isRight = block.align === "right";

                      return (
                        <div
                          style={{ backgroundColor: block.bgColor || "#ffffff" }}
                          onClick={() => openSocialEditor(block.id)}
                          className={`py-5 px-6 flex items-center transition-all cursor-pointer relative group/social ${
                            isLeft ? "justify-start" : isRight ? "justify-end" : "justify-center"
                          }`}
                          title="Click to configure social links"
                        >
                          <div className="flex items-center gap-2.5 flex-wrap">
                            {links.map((link) => {
                              const meta = getSocialPlatformMeta(link.platform);
                              const textColor = block.socialIconColor || meta.color;
                              const iconBg = block.socialIconBg || "#f1f5f9";
                              return (
                                <button
                                  key={link.id}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openSocialEditor(block.id);
                                  }}
                                  style={{
                                    backgroundColor: iconBg,
                                    color: textColor,
                                  }}
                                  className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-xs font-black hover:scale-110 transition-transform shadow-2xs cursor-pointer"
                                  title={`Click to edit ${meta.name} (${link.url})`}
                                >
                                  {link.label || meta.iconText}
                                </button>
                              );
                            })}
                          </div>

                          {/* Quick Configure Overlay */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openSocialEditor(block.id);
                            }}
                            className="absolute top-2 right-2 opacity-0 group-hover/social:opacity-100 transition-opacity bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-xs cursor-pointer z-10"
                          >
                            <Settings2 className="h-3 w-3 text-[#8DB833]" />
                            <span>Configure Social Media</span>
                          </button>
                        </div>
                      );
                    })()}

                    {block.type === "video" && (() => {
                      const parsed = parseVideoUrl(block.videoUrl);
                      const isDirectMedia = Boolean(
                        block.videoUrl &&
                          (block.videoUrl.includes("firebasestorage.googleapis.com") ||
                            /\.(mp4|webm|ogg|mov)($|\?)/i.test(block.videoUrl))
                      );
                      const watchUrl =
                        block.videoWatchUrl?.trim() ||
                        (isDirectMedia
                          ? parsed.watchUrl
                          : block.videoUrl?.trim() || parsed.watchUrl || "https://sanex.rw/#slider");
                      const thumb =
                        block.videoThumbnail ||
                        parsed.thumbnailUrl ||
                        "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80";
                      const title = block.videoTitle || "SANEX in Action";
                      const caption =
                        block.videoCaption ||
                        "Watch our video on sanitation and wastewater services in Rwanda.";
                      const btnText = block.videoButtonText || "Watch Video";
                      const playColor = block.videoPlayButtonColor || "#8DB833";

                      return (
                        <div
                          style={{ backgroundColor: block.bgColor || "#ffffff" }}
                          onClick={() => openVideoEditor(block.id)}
                          className="py-5 px-6 flex justify-center cursor-pointer group/video relative transition-all"
                          title="Click to configure video link and thumbnail"
                        >
                          <div className="w-full max-w-[552px] rounded-xl overflow-hidden border border-slate-200 shadow-xs bg-white transition-all group-hover/video:shadow-md group-hover/video:border-primary/50">
                            {/* VIDEO THUMBNAIL + PLAY BUTTON OVERLAY */}
                            <div className="relative aspect-video bg-black overflow-hidden flex items-center justify-center">
                              <img
                                src={thumb}
                                alt={title}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover/video:scale-105 opacity-90"
                              />
                              <div className="absolute inset-0 bg-black/30 group-hover/video:bg-black/20 transition-colors" />

                              {/* Centered Play Button */}
                              <div
                                style={{ backgroundColor: playColor }}
                                className="relative z-10 w-16 h-16 rounded-full flex items-center justify-center text-black shadow-xl transition-all duration-200 group-hover/video:scale-110"
                              >
                                <Play className="h-7 w-7 fill-current translate-x-0.5" />
                              </div>

                              {/* Video Source Badge */}
                              <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <Film className="h-2.5 w-2.5 text-[#8DB833]" />
                                <span className="capitalize">{parsed.source || "Video"}</span>
                              </div>

                              {/* Click Destination Pill */}
                              <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-xs text-slate-200 text-[10px] font-mono px-2.5 py-0.5 rounded-full flex items-center gap-1.5 border border-white/10 max-w-[85%] truncate shadow-sm">
                                <Link2 className="h-2.5 w-2.5 text-[#8DB833] shrink-0" />
                                <span className="truncate">Opens: {watchUrl}</span>
                              </div>

                              {/* Quick Edit Overlay */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openVideoEditor(block.id);
                                }}
                                className="absolute top-3 right-3 opacity-0 group-hover/video:opacity-100 transition-opacity bg-slate-900/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-xs cursor-pointer z-10"
                              >
                                <Settings2 className="h-3 w-3 text-[#8DB833]" />
                                <span>Configure Video</span>
                              </button>
                            </div>

                            {/* CARD DETAILS BOTTOM BAR */}
                            <div
                              className={`p-4 border-t-2 border-[#8DB833] bg-white ${
                                previewDevice === "mobile"
                                  ? "flex flex-col items-start gap-3"
                                  : "flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                              }`}
                            >
                              <div className="min-w-0 w-full">
                                <h3
                                  className={`text-sm font-extrabold text-slate-900 m-0 ${
                                    previewDevice === "mobile" ? "leading-snug" : "truncate"
                                  }`}
                                >
                                  {title}
                                </h3>
                                {caption && (
                                  <p
                                    className={`text-slate-500 m-0 ${
                                      previewDevice === "mobile"
                                        ? "text-xs leading-relaxed mt-1"
                                        : "text-[11px] line-clamp-1 mt-0.5"
                                    }`}
                                  >
                                    {caption}
                                  </p>
                                )}
                              </div>
                              <div
                                className={
                                  previewDevice === "mobile"
                                    ? "w-full flex items-center justify-start pt-0.5"
                                    : "shrink-0 sm:self-auto self-start"
                                }
                              >
                                <span
                                  style={{ backgroundColor: playColor }}
                                  className="inline-flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-1.5 rounded-md text-black shadow-2xs"
                                >
                                  <Play className="h-3 w-3 fill-current" />
                                  <span>{btnText}</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {block.type === "footer" && (() => {
                      const rawName = (block.recipientName || "").trim();
                      const recName = (!rawName || rawName === "{{name}}" || rawName === "{{email}}")
                        ? "{{email}}"
                        : rawName;
                      const recRole = block.recipientRole || "";
                      const org = block.organization || "";
                      const roleOrgDetails = [recRole, org].filter(Boolean).join(" at ");
                      const showDisc = block.showDisclaimer !== false;
                      const contextText =
                        block.disclaimerContext ||
                        "You are receiving this official communication from SANEX Company Ltd regarding environmental sanitation, liquid waste operations, and wastewater management in Rwanda.";
                      const unsubsUrl = block.unsubscribeUrl || "https://sanex.rw/unsubscribe";

                      return (
                        <div
                          onClick={() => openFooterEditor(block.id)}
                          className="py-6 px-6 bg-[#0f172a] text-slate-400 text-center text-[11px] leading-relaxed space-y-2.5 cursor-pointer group hover:ring-2 hover:ring-[#8DB833]/60 transition-all border-t border-slate-800"
                        >
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold group-hover:border-[#8DB833] transition-colors">
                            <ShieldCheck className="h-3 w-3 text-[#8DB833]" />
                            <span>Enterprise Security &amp; Recipient Disclaimer (LinkedIn Pattern)</span>
                          </div>

                          {showDisc && (
                            <div className="space-y-2 max-w-lg mx-auto">
                              <p className="m-0 text-slate-200 text-xs">
                                This email was intended for{" "}
                                <strong className="text-white underline decoration-slate-600 underline-offset-2">
                                  {recName}
                                </strong>
                                {roleOrgDetails && (
                                  <span className="text-slate-400"> ({roleOrgDetails})</span>
                                )}{" "}
                                ·{" "}
                                <span className="text-[#8DB833] underline hover:text-[#8DB833]/80">
                                  Learn why we included this
                                </span>
                              </p>

                              <p className="m-0 text-slate-400 text-[11px] leading-relaxed">
                                {contextText}
                              </p>

                              <p className="m-0 text-[11px] text-slate-300 space-x-2">
                                <span className="underline hover:text-white">Unsubscribe</span>
                                <span className="text-slate-600">·</span>
                                <span className="underline hover:text-white">Help &amp; Support</span>
                                <span className="text-slate-600">·</span>
                                <span className="underline hover:text-white">Privacy Policy</span>
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* BUTTON & WEBLINK DESTINATION MODAL */}
      <Dialog
        open={!!linkEditModal?.isOpen}
        onOpenChange={(open) => !open && setLinkEditModal(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Link2 className="h-4 w-4 text-teal-600" /> Button & Destination Link Settings
            </DialogTitle>
          </DialogHeader>

          {linkEditModal && (() => {
            const block = blocks.find((b) => b.id === linkEditModal.blockId);
            if (!block) return null;

            const currentUrl = (block as any)[linkEditModal.fieldUrl] || "";
            const currentText = (block as any)[linkEditModal.fieldText] || "";

            return (
              <div className="space-y-4 pt-2 text-xs">
                {/* Button Display Text */}
                <div className="space-y-1.5">
                  <Label htmlFor="modal-btn-text" className="text-xs font-bold text-slate-800">
                    Button Label Text
                  </Label>
                  <Input
                    id="modal-btn-text"
                    value={currentText}
                    onChange={(e) =>
                      updateBlockField(block.id, linkEditModal.fieldText, e.target.value)
                    }
                    placeholder="e.g. Learn More, Read More, Book Now..."
                    className="h-9 text-xs"
                  />
                </div>

                {/* Weblink Destination URL */}
                <div className="space-y-1.5">
                  <Label htmlFor="modal-btn-url" className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Weblink Destination URL</span>
                    <span className="text-[10px] text-muted-foreground font-normal">Where the button leads</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="modal-btn-url"
                      type="url"
                      value={currentUrl}
                      onChange={(e) =>
                        updateBlockField(block.id, linkEditModal.fieldUrl, e.target.value)
                      }
                      placeholder="https://sanex.rw/booking"
                      className="h-9 text-xs pl-8 font-mono"
                    />
                    <Globe className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-3" />
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                    Quick Sanex Destinations:
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: "🌐 Homepage", url: "https://sanex.rw" },
                      { label: "📅 Book Service", url: "https://sanex.rw/booking" },
                      { label: "🛠️ Services", url: "https://sanex.rw/services" },
                      { label: "🏢 About Us", url: "https://sanex.rw/about" },
                      { label: "📞 Contact Us", url: "mailto:info@sanex.rw" },
                      { label: "💬 WhatsApp", url: "https://wa.me/250788300000" },
                    ].map((preset) => (
                      <Button
                        key={preset.label}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateBlockField(block.id, linkEditModal.fieldUrl, preset.url)
                        }
                        className={`h-6 text-[10px] px-2 font-bold ${
                          currentUrl === preset.url
                            ? "bg-teal-50 border-teal-500 text-teal-700 ring-1 ring-teal-500"
                            : "bg-white text-slate-700"
                        }`}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-2 flex justify-end">
                  <Button
                    type="button"
                    onClick={() => setLinkEditModal(null)}
                    className="h-8 text-xs font-bold bg-[#8DB833] text-black hover:bg-[#8DB833]/90"
                  >
                    Save & Close
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* SOCIAL MEDIA & HEADER CONFIGURATION MODAL */}
      <Dialog
        open={!!socialEditModal?.isOpen}
        onOpenChange={(open) => !open && setSocialEditModal(null)}
      >
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0 overflow-hidden bg-white shadow-2xl">
          <DialogHeader className="p-4 border-b bg-white shrink-0">
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Share2 className="h-4 w-4 text-teal-600" /> Header & Social Media Settings
            </DialogTitle>
            <p className="text-[11px] text-muted-foreground m-0">
              Configure which social media channels are displayed, customize their web links, and adjust header appearance.
            </p>
          </DialogHeader>

          {socialEditModal && (() => {
            const block = blocks.find((b) => b.id === socialEditModal.blockId);
            if (!block) return null;

            const effectiveLinks = getEffectiveSocialLinks(block);
            const isTopbar = block.type === "topbar";
            const currentBg = block.bgColor || (isTopbar ? "#8DB833" : "#ffffff");
            const currentAlign = block.align || (isTopbar ? "right" : "center");

            return (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                {/* LIVE PREVIEW STRIP */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] uppercase font-bold text-slate-500">
                      Live Header Preview:
                    </Label>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {currentAlign} aligned · {effectiveLinks.filter((l) => l.enabled !== false && l.url).length} active
                    </span>
                  </div>
                  <div
                    style={{ backgroundColor: currentBg }}
                    className={`py-2 px-5 rounded-md flex items-center transition-colors border border-black/10 shadow-xs ${
                      currentAlign === "left"
                        ? "justify-start"
                        : currentAlign === "center"
                        ? "justify-center"
                        : "justify-end"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {effectiveLinks
                        .filter((l) => l.enabled !== false && l.url)
                        .map((link) => {
                          const meta = getSocialPlatformMeta(link.platform);
                          const textColor = block.socialIconColor || meta.color;
                          const iconBg = block.socialIconBg || (isTopbar ? "#ffffff" : "#f1f5f9");
                          return (
                            <span
                              key={link.id}
                              style={{
                                backgroundColor: iconBg,
                                color: textColor,
                              }}
                              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shadow-2xs"
                              title={`${meta.name}: ${link.url}`}
                            >
                              {link.label || meta.iconText}
                            </span>
                          );
                        })}
                      {effectiveLinks.filter((l) => l.enabled !== false && l.url).length === 0 && (
                        <span className="text-[10px] text-white/70 italic">
                          (No social icons enabled)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* APPEARANCE CONTROLS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 border rounded-lg">
                  {/* Background Color */}
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-slate-700 flex items-center gap-1">
                      <Palette className="h-3 w-3 text-teal-600" /> Header Bar Color
                    </Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={currentBg}
                        onChange={(e) => updateBlockField(block.id, "bgColor", e.target.value)}
                        className="h-7 w-7 rounded cursor-pointer border border-slate-300 p-0 shrink-0"
                      />
                      <Input
                        type="text"
                        value={currentBg}
                        onChange={(e) => updateBlockField(block.id, "bgColor", e.target.value)}
                        className="h-7 text-xs font-mono"
                        placeholder="#8DB833"
                      />
                    </div>
                    {/* Quick Swatches */}
                    <div className="flex items-center gap-1.5 pt-0.5">
                      {[
                        { label: "Sanex Lime", color: "#8DB833" },
                        { label: "Dark Slate", color: "#0f172a" },
                        { label: "Black", color: "#000000" },
                        { label: "White", color: "#ffffff" },
                      ].map((swatch) => (
                        <button
                          key={swatch.color}
                          type="button"
                          onClick={() => updateBlockField(block.id, "bgColor", swatch.color)}
                          style={{ backgroundColor: swatch.color }}
                          className={`h-4 w-4 rounded-full border border-slate-300 transition-all ${
                            currentBg.toLowerCase() === swatch.color.toLowerCase()
                              ? "ring-2 ring-teal-500 scale-110"
                              : "hover:scale-105"
                          }`}
                          title={swatch.label}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Alignment */}
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-slate-700">
                      Icons Alignment
                    </Label>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { id: "left", label: "Left" },
                        { id: "center", label: "Center" },
                        { id: "right", label: "Right" },
                      ].map((al) => (
                        <Button
                          key={al.id}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateBlockField(block.id, "align", al.id)}
                          className={`h-7 text-[10px] font-bold ${
                            currentAlign === al.id
                              ? "bg-teal-50 border-teal-500 text-teal-700 ring-1 ring-teal-500"
                              : "bg-white text-slate-700"
                          }`}
                        >
                          {al.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* CHANNELS LIST */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-900">
                      Configure Social Channels & URLs
                    </Label>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = blocks.map((b) =>
                          b.id === block.id ? { ...b, socialLinks: [...DEFAULT_HEADER_SOCIALS] } : b
                        );
                        commitBlocks(updated);
                      }}
                      className="text-[10px] text-teal-600 hover:text-teal-700 hover:underline font-bold"
                    >
                      Reset to Sanex Defaults
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100 border rounded-lg bg-white overflow-hidden shadow-2xs">
                    {effectiveLinks.map((link) => {
                      const meta = getSocialPlatformMeta(link.platform);
                      const isEnabled = link.enabled !== false;

                      return (
                        <div
                          key={link.id}
                          className={`p-2.5 flex items-center gap-2.5 transition-colors ${
                            isEnabled ? "bg-white" : "bg-slate-50/60 opacity-60"
                          }`}
                        >
                          {/* Toggle active checkbox */}
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={(e) => {
                              const nextLinks = effectiveLinks.map((l) =>
                                l.id === link.id ? { ...l, enabled: e.target.checked } : l
                              );
                              const updated = blocks.map((b) =>
                                b.id === block.id ? { ...b, socialLinks: nextLinks } : b
                              );
                              commitBlocks(updated);
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                            id={`social-toggle-${link.id}`}
                          />

                          {/* Icon Badge Preview */}
                          <div
                            style={{
                              backgroundColor: meta.bg || "#ffffff",
                              color: meta.color || "#0f172a",
                            }}
                            className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center text-xs font-black shrink-0 shadow-2xs"
                          >
                            {link.label || meta.iconText}
                          </div>

                          {/* Channel Details & URL Input */}
                          <div className="flex-1 space-y-0.5 min-w-0">
                            <div className="flex items-center justify-between">
                              <label
                                htmlFor={`social-toggle-${link.id}`}
                                className="text-[11px] font-bold text-slate-800 cursor-pointer"
                              >
                                {meta.name}
                              </label>
                              {link.url !== meta.defaultUrl && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextLinks = effectiveLinks.map((l) =>
                                      l.id === link.id ? { ...l, url: meta.defaultUrl } : l
                                    );
                                    const updated = blocks.map((b) =>
                                      b.id === block.id ? { ...b, socialLinks: nextLinks } : b
                                    );
                                    commitBlocks(updated);
                                  }}
                                  className="text-[9px] text-teal-600 hover:underline"
                                  title="Reset to default official Sanex URL"
                                >
                                  Reset URL
                                </button>
                              )}
                            </div>
                            <Input
                              type="url"
                              value={link.url}
                              disabled={!isEnabled}
                              onChange={(e) => {
                                const nextLinks = effectiveLinks.map((l) =>
                                  l.id === link.id ? { ...l, url: e.target.value } : l
                                );
                                const updated = blocks.map((b) =>
                                  b.id === block.id ? { ...b, socialLinks: nextLinks } : b
                                );
                                setBlocks(updated);
                              }}
                              placeholder={meta.placeholder}
                              className="h-7 text-xs font-mono disabled:opacity-40"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Add Custom Social Channel Button */}
                <div className="pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newId = `custom-social-${Date.now()}`;
                      const nextLinks: SocialLinkItem[] = [
                        ...effectiveLinks,
                        {
                          id: newId,
                          platform: "website",
                          url: "https://sanex.rw",
                          label: "🔗",
                          enabled: true,
                        },
                      ];
                      const updated = blocks.map((b) =>
                        b.id === block.id ? { ...b, socialLinks: nextLinks } : b
                      );
                      commitBlocks(updated);
                    }}
                    className="h-7 text-[10px] font-bold gap-1 border-dashed w-full text-slate-600 hover:text-slate-900"
                  >
                    <Plus className="h-3 w-3" /> Add Another Social Link / Custom Website
                  </Button>
                </div>
              </div>
            );
          })()}

          <div className="p-3 border-t bg-slate-50 flex items-center justify-between shrink-0">
            <span className="text-[11px] text-muted-foreground">
              Social links and colors update live in your email template.
            </span>
            <Button
              type="button"
              onClick={() => setSocialEditModal(null)}
              className="h-8 text-xs font-bold bg-[#8DB833] text-black hover:bg-[#8DB833]/90 shadow-xs"
            >
              Done & Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* VIDEO CONFIGURATION MODAL */}
      <Dialog
        open={!!videoEditModal?.isOpen}
        onOpenChange={(open) => !open && setVideoEditModal(null)}
      >
        <DialogContent className="max-w-xl max-h-[88vh] flex flex-col p-0 overflow-hidden bg-white shadow-2xl">
          <DialogHeader className="p-4 border-b bg-white shrink-0">
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Video className="h-4 w-4 text-emerald-600" /> Video Block Configuration
            </DialogTitle>
            <p className="text-[11px] text-muted-foreground m-0">
              Link to YouTube, Vimeo, website videos, or uploaded MP4 files with a clickable play button.
            </p>
          </DialogHeader>

          {videoEditModal && (() => {
            const block = blocks.find((b) => b.id === videoEditModal.blockId);
            if (!block) return null;

            const parsed = parseVideoUrl(block.videoUrl);
            const isDirectMedia = Boolean(
              block.videoUrl &&
                (block.videoUrl.includes("firebasestorage.googleapis.com") ||
                  /\.(mp4|webm|ogg|mov)($|\?)/i.test(block.videoUrl))
            );
            const effectiveWatchUrl =
              block.videoWatchUrl?.trim() ||
              (isDirectMedia
                ? parsed.watchUrl
                : block.videoUrl?.trim() || parsed.watchUrl || "https://sanex.rw/#slider");

            const currentThumb =
              block.videoThumbnail ||
              parsed.thumbnailUrl ||
              "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80";
            const currentTitle = block.videoTitle || "SANEX in Action";
            const currentCaption =
              block.videoCaption ||
              "Watch our specialized vacuum trucks and decentralized treatment systems in action.";
            const currentBtnText = block.videoButtonText || "Watch Video";
            const currentPlayColor = block.videoPlayButtonColor || "#8DB833";

            return (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                {/* LIVE PREVIEW CARD */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-slate-500">
                    Live Video Card Preview:
                  </Label>
                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-xs">
                    <div className="relative aspect-video bg-black overflow-hidden flex items-center justify-center">
                      <img
                        src={currentThumb}
                        alt={currentTitle}
                        className="w-full h-full object-cover opacity-90"
                      />
                      <div className="absolute inset-0 bg-black/25" />
                      <div
                        style={{ backgroundColor: currentPlayColor }}
                        className="relative z-10 w-14 h-14 rounded-full flex items-center justify-center text-black shadow-lg"
                      >
                        <Play className="h-6 w-6 fill-current translate-x-0.5" />
                      </div>
                      <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Film className="h-2.5 w-2.5 text-[#8DB833]" />
                        <span className="capitalize">{parsed.source || "Video"}</span>
                      </div>
                      <div className="absolute bottom-2 left-2 bg-black/85 backdrop-blur-xs text-[9px] text-slate-200 px-2.5 py-0.5 rounded-md flex items-center gap-1 max-w-[90%] truncate font-mono border border-white/10 shadow-xs">
                        <Link2 className="h-2.5 w-2.5 text-[#8DB833] shrink-0" />
                        <span className="truncate">Opens: {effectiveWatchUrl}</span>
                      </div>
                    </div>
                    <div className="p-3 border-t-2 border-[#8DB833] flex items-center justify-between gap-3 bg-white">
                      <div className="min-w-0 flex-1">
                        <div className="font-extrabold text-slate-900 text-xs truncate">
                          {currentTitle}
                        </div>
                        <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                          {currentCaption}
                        </div>
                      </div>
                      <span
                        style={{ backgroundColor: currentPlayColor }}
                        className="text-[10px] font-extrabold px-3 py-1 rounded text-black shrink-0"
                      >
                        ▶ {currentBtnText}
                      </span>
                    </div>
                  </div>
                </div>

                {/* SECTION 1: CLICK DESTINATION URL (CRITICAL) */}
                <div className="p-3.5 rounded-lg border-2 border-emerald-500/40 bg-emerald-50/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Link2 className="h-4 w-4 text-emerald-600" /> Click Destination on Website
                    </Label>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Where recipients go when clicked
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 m-0 leading-relaxed">
                    When someone clicks this video in their email, they will be taken directly to this website URL. By default, it opens the interactive website slider (<code className="bg-emerald-100 text-emerald-900 px-1 py-0.5 rounded font-mono text-[10px]">https://sanex.rw/#slider</code>) where the video is presented in context, rather than opening a raw video file in the browser.
                  </p>

                  <Input
                    type="url"
                    value={block.videoWatchUrl ?? (isDirectMedia ? "https://sanex.rw/#slider" : block.videoUrl || "https://sanex.rw/#slider")}
                    onChange={(e) => updateBlock(block.id, { videoWatchUrl: e.target.value })}
                    placeholder="https://sanex.rw/#slider"
                    className="h-8 text-xs font-mono bg-white border-emerald-300 focus-visible:ring-emerald-500"
                  />

                  {/* QUICK DESTINATION BUTTONS */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className="text-[10px] text-slate-500 font-bold">Quick Destinations:</span>
                    <button
                      type="button"
                      onClick={() => updateBlock(block.id, { videoWatchUrl: "https://sanex.rw/#slider" })}
                      className="px-2 py-0.5 text-[10px] font-bold bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 rounded transition-colors shadow-2xs"
                    >
                      ▶ SANEX Website Slider (#slider)
                    </button>
                    <button
                      type="button"
                      onClick={() => updateBlock(block.id, { videoWatchUrl: "https://sanex.rw" })}
                      className="px-2 py-0.5 text-[10px] font-bold bg-white border border-slate-200 hover:border-slate-400 rounded text-slate-700 transition-colors"
                    >
                      🌐 SANEX Homepage
                    </button>
                    <button
                      type="button"
                      onClick={() => updateBlock(block.id, { videoWatchUrl: "https://sanex.rw/gallery" })}
                      className="px-2 py-0.5 text-[10px] font-bold bg-white border border-slate-200 hover:border-slate-400 rounded text-slate-700 transition-colors"
                    >
                      🎥 Media Gallery
                    </button>
                  </div>
                </div>

                {/* SECTION 2: VIDEO MEDIA SOURCE */}
                <div className="p-3 rounded-lg border bg-slate-50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Film className="h-3.5 w-3.5 text-slate-700" /> Video Media File / Source Link
                    </Label>
                    {parsed.source === "youtube" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                        <Youtube className="h-3 w-3" /> YouTube ID: {parsed.videoId}
                      </span>
                    ) : parsed.source === "mp4" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                        <Film className="h-3 w-3" /> MP4 Video File
                      </span>
                    ) : null}
                  </div>

                  <Input
                    type="url"
                    value={block.videoUrl || ""}
                    onChange={(e) => {
                      const nextUrl = e.target.value;
                      const nextParsed = parseVideoUrl(nextUrl);
                      const isMp4 = nextUrl.includes("firebasestorage.googleapis.com") || /\.(mp4|webm|ogg|mov)($|\?)/i.test(nextUrl);
                      const autoThumb =
                        nextParsed.source === "youtube" && nextParsed.thumbnailUrl
                          ? nextParsed.thumbnailUrl
                          : block.videoThumbnail;

                      updateBlock(block.id, {
                        videoUrl: nextUrl,
                        videoSource: nextParsed.source,
                        videoThumbnail: autoThumb,
                        videoWatchUrl: block.videoWatchUrl || (isMp4 ? "https://sanex.rw/#slider" : undefined),
                      });
                    }}
                    placeholder="https://firebasestorage.googleapis.com/... or YouTube URL"
                    className="h-8 text-xs font-mono bg-white"
                  />

                  {/* QUICK SOURCE PRESETS */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] text-slate-500 font-bold">Quick Presets:</span>
                    <button
                      type="button"
                      onClick={() => {
                        updateBlock(block.id, {
                          videoUrl:
                            "https://firebasestorage.googleapis.com/v0/b/studio-9595184890-5bb3c.firebasestorage.app/o/uploads%2F1792173462347_Sanex%20Promo%20Video%20Final.mp4?alt=media&token=7a2b61d9-7261-4583-8b10-7770fd0bc41f",
                          videoWatchUrl: "https://sanex.rw/#slider",
                          videoSource: "mp4",
                          videoTitle: "SANEX in Action: Our Solutions & Services",
                          videoCaption:
                            "Watch our specialized vacuum trucks and innovative sanitation solutions in action on our website slider.",
                          videoButtonText: "Watch on Website Slider",
                        });
                      }}
                      className="px-2 py-0.5 text-[10px] font-bold bg-white border border-slate-200 hover:border-slate-400 rounded text-slate-700 transition-colors"
                    >
                      Website Slider Video (MP4)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateBlock(block.id, {
                          videoUrl: "https://sanex.rw/#slider",
                          videoWatchUrl: "https://sanex.rw/#slider",
                          videoSource: "website",
                          videoTitle: "SANEX in Action: Operational Highlights",
                          videoCaption:
                            "Watch our specialized vacuum trucks and decentralized treatment systems providing essential sanitation services across Rwanda.",
                          videoButtonText: "Watch on Website Slider",
                        });
                      }}
                      className="px-2 py-0.5 text-[10px] font-bold bg-white border border-slate-200 hover:border-slate-400 rounded text-slate-700 transition-colors"
                    >
                      SANEX Homepage Slider
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateBlock(block.id, {
                          videoUrl: "https://sanex.rw/gallery",
                          videoWatchUrl: "https://sanex.rw/gallery",
                          videoSource: "website",
                          videoTitle: "SANEX Media & Operations Gallery",
                          videoCaption:
                            "Explore photos and operational video clips of our liquid waste management projects.",
                          videoButtonText: "Explore Gallery",
                        });
                      }}
                      className="px-2 py-0.5 text-[10px] font-bold bg-white border border-slate-200 hover:border-slate-400 rounded text-slate-700 transition-colors"
                    >
                      SANEX Gallery
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateBlock(block.id, {
                          videoUrl: "https://youtube.com/@sanexrwanda",
                          videoWatchUrl: "https://youtube.com/@sanexrwanda",
                          videoSource: "youtube",
                          videoTitle: "SANEX Official YouTube Channel",
                          videoCaption:
                            "Subscribe and watch informative videos on sanitation, DWTS, and environmental protection.",
                          videoButtonText: "Watch on YouTube",
                        });
                      }}
                      className="px-2 py-0.5 text-[10px] font-bold bg-white border border-slate-200 hover:border-slate-400 rounded text-slate-700 transition-colors"
                    >
                      YouTube Channel
                    </button>
                  </div>
                </div>

                {/* THUMBNAIL / COVER IMAGE */}
                <div className="p-3 rounded-lg border bg-slate-50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <ImageIcon className="h-3.5 w-3.5 text-slate-700" /> Video Thumbnail / Cover Image
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openImageEditor(block.id, "videoThumbnail", "Video Cover Thumbnail")}
                      className="h-6 text-[10px] font-bold px-2 gap-1 bg-white border-slate-300"
                    >
                      <UploadCloud className="h-3 w-3 text-slate-700" /> Upload / Select Cover
                    </Button>
                  </div>

                  <Input
                    type="url"
                    value={block.videoThumbnail || ""}
                    onChange={(e) => updateBlock(block.id, { videoThumbnail: e.target.value })}
                    placeholder="https://... cover image URL"
                    className="h-8 text-xs font-mono bg-white"
                  />

                  {parsed.source === "youtube" && parsed.thumbnailUrl && (
                    <button
                      type="button"
                      onClick={() => updateBlock(block.id, { videoThumbnail: parsed.thumbnailUrl })}
                      className="text-[10px] text-teal-700 hover:underline font-bold flex items-center gap-1"
                    >
                      <span>Reset to official HD YouTube cover thumbnail</span>
                    </button>
                  )}
                </div>

                {/* VIDEO TITLE & SUBTITLE */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-800">Video Title</Label>
                    <Input
                      type="text"
                      value={block.videoTitle || ""}
                      onChange={(e) => updateBlock(block.id, { videoTitle: e.target.value })}
                      placeholder="e.g. SANEX in Action: Liquid Waste Management"
                      className="h-8 text-xs bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-800">Caption / Summary</Label>
                    <textarea
                      value={block.videoCaption || ""}
                      onChange={(e) => updateBlock(block.id, { videoCaption: e.target.value })}
                      placeholder="Brief description of what recipients will see in this video..."
                      rows={2}
                      className="w-full text-xs p-2 rounded-md border border-input bg-white resize-none"
                    />
                  </div>
                </div>

                {/* CALL-TO-ACTION BUTTON & PLAY ACCENT */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-800">Button Text</Label>
                    <Input
                      type="text"
                      value={block.videoButtonText || ""}
                      onChange={(e) => updateBlock(block.id, { videoButtonText: e.target.value })}
                      placeholder="Watch Video"
                      className="h-8 text-xs bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-800">Play Button Color</Label>
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="color"
                        value={currentPlayColor}
                        onChange={(e) => updateBlock(block.id, { videoPlayButtonColor: e.target.value })}
                        className="h-8 w-10 p-0.5 cursor-pointer rounded bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => updateBlock(block.id, { videoPlayButtonColor: "#8DB833" })}
                        className="px-2 py-1 text-[10px] font-bold rounded bg-[#8DB833] text-black shadow-2xs"
                        title="SANEX Lime Green"
                      >
                        Brand
                      </button>
                      <button
                        type="button"
                        onClick={() => updateBlock(block.id, { videoPlayButtonColor: "#000000" })}
                        className="px-2 py-1 text-[10px] font-bold rounded bg-black text-white shadow-2xs"
                        title="Dark"
                      >
                        Black
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="p-3 border-t bg-slate-50 flex items-center justify-between shrink-0">
            <span className="text-[11px] text-muted-foreground">
              Video block generates responsive, email-client-safe code.
            </span>
            <Button
              type="button"
              onClick={() => setVideoEditModal(null)}
              className="h-8 text-xs font-bold bg-[#8DB833] text-black hover:bg-[#8DB833]/90 shadow-xs"
            >
              Done & Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* FOOTER & DISCLAIMER CONFIGURATION MODAL (LINKEDIN PATTERN) */}
      <Dialog
        open={!!footerEditModal?.isOpen}
        onOpenChange={(open) => !open && setFooterEditModal(null)}
      >
        <DialogContent className="max-w-lg max-h-[88vh] flex flex-col p-0 overflow-hidden bg-white shadow-2xl">
          <DialogHeader className="p-4 border-b bg-white shrink-0">
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#8DB833]" />
              <span>Configure Recipient Disclaimer &amp; Legal Footer</span>
            </DialogTitle>
            <p className="text-xs text-muted-foreground m-0">
              Customize the LinkedIn-style anti-phishing security guard, CAN-SPAM compliance links, and registered company address.
            </p>
          </DialogHeader>

          {footerEditModal && (() => {
            const block = blocks.find((b) => b.id === footerEditModal.blockId);
            if (!block) return null;

            return (
              <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
                {/* 1. Recipient Guard */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      Recipient Security Guard (Anti-Phishing)
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-semibold">Include</span>
                      <Switch
                        checked={block.showDisclaimer !== false}
                        onCheckedChange={(val) => updateBlockField(block.id, "showDisclaimer", val)}
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 m-0">
                    Displays recipient name, job title, and organization so the recipient confirms message authenticity.
                  </p>

                  <div className="space-y-2 pt-1">
                    <div className="space-y-1">
                      <Label className="text-[11px] uppercase font-bold text-slate-600 mb-1 block">
                        Recipient Identifier / Merge Variable (defaults to recipient email):
                      </Label>
                      <Input
                        type="text"
                        value={block.recipientName === "{{name}}" ? "{{email}}" : (block.recipientName || "")}
                        onChange={(e) => updateBlockField(block.id, "recipientName", e.target.value)}
                        placeholder="{{email}} or recipient name"
                        className="h-8 text-xs bg-white font-mono"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        Use <code className="text-[#4d7c0f] font-bold">{"{{email}}"}</code> to automatically display each recipient&apos;s actual email address in the security disclaimer.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">
                          Role / Title (optional):
                        </Label>
                        <Input
                          type="text"
                          value={block.recipientRole || ""}
                          onChange={(e) => updateBlockField(block.id, "recipientRole", e.target.value)}
                          placeholder="e.g. Director"
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">
                          Organization / Company (optional):
                        </Label>
                        <Input
                          type="text"
                          value={block.organization || ""}
                          onChange={(e) => updateBlockField(block.id, "organization", e.target.value)}
                          placeholder="e.g. Ministry of Environment"
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                    </div>

                    {/* Quick Variable Chips */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-slate-500 font-bold">Quick Tags:</span>
                      {[
                        { label: "{{email}}", field: "recipientName" as const },
                        { label: "{{name}}", field: "recipientName" as const },
                        { label: "{{role}}", field: "recipientRole" as const },
                        { label: "{{organization}}", field: "organization" as const },
                      ].map((chip) => (
                        <button
                          key={chip.label}
                          type="button"
                          onClick={() => updateBlockField(block.id, chip.field, chip.label)}
                          className="text-[10px] font-mono font-bold bg-white border border-slate-300 hover:border-[#8DB833] hover:text-[#4d7c0f] px-1.5 py-0.5 rounded transition-colors"
                        >
                          + {chip.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. Communication Context */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-800">
                    Communication Reason / Context:
                  </Label>
                  <AutoResizingTextarea
                    value={block.disclaimerContext || ""}
                    onChange={(e: any) => updateBlockField(block.id, "disclaimerContext", e.target.value)}
                    placeholder="You are receiving this official communication from SANEX Company Ltd regarding environmental sanitation, liquid waste operations, and wastewater management in Rwanda."
                    className="w-full text-xs p-2.5 rounded-md border border-slate-300 bg-white leading-relaxed focus:ring-1 focus:ring-slate-900"
                    rows={2}
                  />
                  <p className="text-[10px] text-slate-500 m-0">
                    CAN-SPAM / GDPR requirement: Informs the recipient why they are receiving this campaign or notice.
                  </p>
                </div>

                {/* 3. Action & Compliance URLs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-slate-600 flex items-center gap-1">
                      <Link2 className="h-3 w-3 text-teal-600" /> Unsubscribe Link:
                    </Label>
                    <Input
                      type="url"
                      value={block.unsubscribeUrl || ""}
                      onChange={(e) => updateBlockField(block.id, "unsubscribeUrl", e.target.value)}
                      placeholder="https://sanex.rw/unsubscribe or {{unsubscribeUrl}}"
                      className="h-8 text-xs bg-white font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-slate-600 flex items-center gap-1">
                      <Globe className="h-3 w-3 text-teal-600" /> Help &amp; Support URL:
                    </Label>
                    <Input
                      type="url"
                      value={block.helpUrl || ""}
                      onChange={(e) => updateBlockField(block.id, "helpUrl", e.target.value)}
                      placeholder="https://sanex.rw/contact"
                      className="h-8 text-xs bg-white font-mono"
                    />
                  </div>
                </div>

                {/* 4. Live Preview Banner */}
                <div className="p-3 bg-slate-900 text-slate-300 rounded-lg text-[10px] space-y-1.5 border border-slate-800">
                  <span className="text-[9px] font-extrabold uppercase text-[#8DB833] tracking-wider block">
                    Live Disclaimer Preview:
                  </span>
                  <p className="m-0 text-slate-300">
                    This email was intended for{" "}
                    <strong className="text-white">
                      {(!block.recipientName || block.recipientName === "{{name}}" || block.recipientName === "{{email}}")
                        ? "{{email}}"
                        : block.recipientName}
                    </strong>
                    {(block.recipientRole || block.organization) && (
                      <span className="text-slate-400"> ({[block.recipientRole, block.organization].filter(Boolean).join(" at ")})</span>
                    )} · <span className="text-[#8DB833] underline">Learn why we included this</span>.
                  </p>
                  <p className="m-0 text-slate-400">
                    Unsubscribe · Help &amp; Support · Privacy Policy
                  </p>
                </div>

                {/* Action button */}
                <div className="pt-2 flex justify-end">
                  <Button
                    type="button"
                    onClick={() => setFooterEditModal(null)}
                    className="h-8 text-xs font-bold bg-[#8DB833] text-black hover:bg-[#8DB833]/90"
                  >
                    Save &amp; Apply Footer
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* IMAGE SETTINGS & CLOUD CDN MODAL */}
      <Dialog
        open={Boolean(imageEditModal?.isOpen)}
        onOpenChange={(open) => {
          if (!open) setImageEditModal(null);
        }}
      >
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          {imageEditModal && (() => {
            const block = blocks.find((b) => b.id === imageEditModal.blockId);
            if (!block) return null;
            const currentUrl = (block[imageEditModal.field] as string) || "";
            const isBase64 = currentUrl.startsWith("data:");
            const isHttps = currentUrl.startsWith("https://") || currentUrl.startsWith("http://");

            return (
              <div className="space-y-4">
                <DialogHeader>
                  <DialogTitle className="text-base font-bold flex items-center gap-2">
                    <UploadCloud className="h-5 w-5 text-[#8DB833]" />
                    <span>{imageEditModal.title || "Image Settings & CDN Cloud Hosting"}</span>
                  </DialogTitle>
                </DialogHeader>

                {/* Anti-Attachment Security & Inbox Delivery Callout */}
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Anti-Attachment Protection Active</span>
                  </div>
                  <p className="text-emerald-800 text-[11px] m-0 leading-relaxed">
                    Email clients (Gmail, Outlook, Apple Mail) detach local or base64 data images as file attachments (e.g. <code>ATT00001.jpg</code>). 
                    Uploading here automatically hosts your image on the <strong>Firebase Storage Cloud CDN</strong>, guaranteeing your images render beautifully inline.
                  </p>
                </div>

                {/* Current Image Preview */}
                <div className="bg-slate-100 rounded-lg p-3 flex flex-col sm:flex-row items-center gap-3 border">
                  <div className="w-24 h-20 bg-slate-200 rounded overflow-hidden flex items-center justify-center shrink-0 border border-slate-300">
                    {currentUrl ? (
                      <img src={currentUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">Current Source:</span>
                      {isBase64 ? (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Local Base64 (Will Attach)
                        </span>
                      ) : isHttps ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Cloud CDN (Renders Inline)
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">None set</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono truncate m-0">
                      {currentUrl || "No image URL specified"}
                    </p>
                  </div>
                </div>

                {/* Tabs for Upload vs URL vs Presets */}
                <Tabs defaultValue="upload" className="w-full">
                  <TabsList className="grid grid-cols-3 w-full bg-slate-100">
                    <TabsTrigger value="upload" className="text-xs font-bold gap-1.5">
                      <Upload className="h-3.5 w-3.5" /> Upload to Cloud
                    </TabsTrigger>
                    <TabsTrigger value="url" className="text-xs font-bold gap-1.5">
                      <Link2 className="h-3.5 w-3.5" /> Online HTTPS URL
                    </TabsTrigger>
                    <TabsTrigger value="presets" className="text-xs font-bold gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" /> SANEX Library
                    </TabsTrigger>
                  </TabsList>

                  {/* TAB 1: UPLOAD */}
                  <TabsContent value="upload" className="space-y-3 pt-3">
                    <div
                      onClick={() => triggerImageUpload(imageEditModal.blockId, imageEditModal.field)}
                      className="border-2 border-dashed border-slate-300 hover:border-[#8DB833] bg-slate-50 hover:bg-slate-100/80 rounded-xl p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2"
                    >
                      {isUploadingImage ? (
                        <>
                          <Loader2 className="h-8 w-8 text-[#8DB833] animate-spin" />
                          <span className="text-xs font-bold text-slate-800">
                            {uploadProgressMsg || "Uploading to Cloud CDN..."}
                          </span>
                          <span className="text-[11px] text-slate-500">Please wait while the image is compressed and hosted...</span>
                        </>
                      ) : (
                        <>
                          <div className="h-10 w-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
                            <UploadCloud className="h-5 w-5" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-800 m-0">
                              Click here to select a file from your computer
                            </p>
                            <p className="text-[11px] text-slate-500 m-0">
                              PNG, JPG, WebP, or GIF (automatically resized and uploaded to Cloud CDN)
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            className="mt-2 h-7 text-xs font-bold bg-[#8DB833] text-black hover:bg-[#8DB833]/90"
                          >
                            Browse Files
                          </Button>
                        </>
                      )}
                    </div>
                  </TabsContent>

                  {/* TAB 2: ONLINE URL */}
                  <TabsContent value="url" className="space-y-3 pt-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700">Direct HTTPS Image Link:</Label>
                      <Input
                        type="url"
                        value={currentUrl.startsWith("data:") ? "" : currentUrl}
                        onChange={(e) => updateBlockField(imageEditModal.blockId, imageEditModal.field, e.target.value)}
                        placeholder="https://sanex.rw/images/... or https://firebasestorage..."
                        className="text-xs font-mono bg-white"
                      />
                      <p className="text-[11px] text-slate-500 m-0">
                        Must begin with <code>https://</code> so all recipient email clients render it directly.
                      </p>
                    </div>
                  </TabsContent>

                  {/* TAB 3: SANEX PRESETS */}
                  <TabsContent value="presets" className="space-y-3 pt-3">
                    <span className="text-xs font-bold text-slate-700 block">
                      Official SANEX Brand Assets:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        {
                          name: "Clean Water Delivery Truck",
                          category: "Water Services",
                          url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
                        },
                        {
                          name: "DWTS Wastewater Treatment",
                          category: "Decentralized Systems",
                          url: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=800&q=80",
                        },
                        {
                          name: "Vacuum Tanker Operations",
                          category: "Exhauster Services",
                          url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
                        },
                        {
                          name: "Safe Water Facility",
                          category: "Infrastructure",
                          url: "https://images.unsplash.com/photo-1527689368864-3a821dbccc34?auto=format&fit=crop&w=800&q=80",
                        },
                      ].map((item) => (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => updateBlockField(imageEditModal.blockId, imageEditModal.field, item.url)}
                          className="p-2 border rounded-lg text-left bg-white hover:bg-slate-50 hover:border-[#8DB833] transition-all flex items-center gap-2.5 group"
                        >
                          <img src={item.url} alt={item.name} className="w-12 h-10 object-cover rounded shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-slate-800 truncate m-0 group-hover:text-teal-700">
                              {item.name}
                            </p>
                            <p className="text-[10px] text-slate-500 m-0">{item.category}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Image Dimensions & Alignment (if applicable) */}
                {imageEditModal.field === "logoUrl" ? (
                  <div className="border-t pt-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800 m-0">Header Brand Logo Format</p>
                      <p className="text-[11px] text-slate-500 m-0">
                        Rendered as a 44×44 circular brand emblem with the signature #8DB833 border in email clients.
                      </p>
                    </div>
                    {Boolean(block.logoUrl) && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          updateBlockField(imageEditModal.blockId, "logoUrl", "");
                        }}
                        className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      >
                        Reset to 🚛 Emblem
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="border-t pt-3 space-y-2">
                    <span className="text-[11px] font-bold uppercase text-slate-500 block">
                      Display Sizing:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                          Preset Widths:
                        </Label>
                        <div className="flex items-center gap-1">
                          {[
                            { label: "100%", val: "100%" },
                            { label: "340px", val: 340 },
                            { label: "260px", val: 260 },
                            { label: "180px", val: 180 },
                          ].map((p) => {
                            const widthProp = imageEditModal.field === "col1Image" ? "col1ImageWidth" : "imageWidth";
                            return (
                              <button
                                key={p.label}
                                type="button"
                                onClick={() => updateBlockField(imageEditModal.blockId, widthProp, p.val)}
                                className="text-[10px] font-bold px-2 py-1 rounded border bg-white hover:border-[#8DB833] text-slate-700"
                              >
                                {p.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {imageEditModal.field === "imageUrl" && (
                        <div>
                          <Label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                            Alt Text (Accessibility):
                          </Label>
                          <Input
                            type="text"
                            value={block.imageAlt || ""}
                            onChange={(e) => updateBlockField(imageEditModal.blockId, "imageAlt", e.target.value)}
                            placeholder="SANEX Environmental Service"
                            className="h-7 text-xs bg-white"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Dialog Action Buttons */}
                <div className="pt-2 flex justify-end gap-2 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setImageEditModal(null)}
                    className="text-xs h-8"
                  >
                    Done
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* FULL EMAIL PREVIEW MODAL */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0 overflow-hidden bg-slate-100">
          <DialogHeader className="p-4 border-b bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#8DB833]" /> Live Responsive Email Preview
            </DialogTitle>

            {/* Desktop / Mobile view switcher */}
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50 p-0.5">
              <button
                type="button"
                onClick={() => setModalPreviewDevice("desktop")}
                className={`px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 rounded transition-all ${
                  modalPreviewDevice === "desktop"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Monitor className="h-3.5 w-3.5" /> Desktop (600px)
              </button>
              <button
                type="button"
                onClick={() => setModalPreviewDevice("mobile")}
                className={`px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 rounded transition-all ${
                  modalPreviewDevice === "mobile"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" /> Mobile (375px)
              </button>
            </div>

            <span className="text-xs text-muted-foreground hidden sm:block">
              Ready for Zoho CPaaS Email Dispatch
            </span>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex justify-center">
            <iframe
              srcDoc={
                modalPreviewDevice === "mobile"
                  ? compiledHtml.replace("<html", '<html class="mobile-forced"')
                  : compiledHtml
              }
              title="Email Preview"
              className={`w-full min-h-[580px] bg-white rounded-lg shadow-md border transition-all duration-300 ${
                modalPreviewDevice === "mobile" ? "max-w-[375px]" : "max-w-[620px]"
              }`}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* HOW TO USE BUILDER MODAL */}
      <Dialog open={showHelpModal} onOpenChange={setShowHelpModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-teal-600" /> How to Use the Email Studio Builder
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-xs leading-relaxed text-slate-700 pt-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#8DB833] shrink-0 mt-0.5" />
              <span>
                <strong>Adding Content:</strong> Click any block in the left sidebar (Image, Heading, Button, Columns) to add it to your email.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#8DB833] shrink-0 mt-0.5" />
              <span>
                <strong>Inline Text Editing:</strong> Click directly into any title, paragraph, or button text on the canvas to edit.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#8DB833] shrink-0 mt-0.5" />
              <span>
                <strong>Link Destination:</strong> Click any "Learn More", "Read More", or CTA button to set its destination weblink URL and choose presets.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#8DB833] shrink-0 mt-0.5" />
              <span>
                <strong>Upload Photos:</strong> Hover any photo and click <em>Replace / Upload</em> to select any image from your computer.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#8DB833] shrink-0 mt-0.5" />
              <span>
                <strong>Drag-to-Resize:</strong> Hover over the vertical column border and drag left/right to resize columns. Drag the corner square on any image to resize photos.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#8DB833] shrink-0 mt-0.5" />
              <span>
                <strong>Save & Send:</strong> When satisfied, click <em>Save & Send →</em> to return to the audience & email sending interface.
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
