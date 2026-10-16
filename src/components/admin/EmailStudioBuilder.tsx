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
} from "lucide-react";

export type BlockType =
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
}

interface EmailStudioBuilderProps {
  initialHtml?: string;
  initialBlocks?: EmailBlock[];
  onSaveAndProceed: (compiledHtml: string, blocks: EmailBlock[]) => void;
  onBackToSending: (blocks?: EmailBlock[]) => void;
}

const INITIAL_SANEX_BLOCKS: EmailBlock[] = [
  {
    id: "topbar-1",
    type: "topbar",
    bgColor: "#8DB833",
  },
  {
    id: "logo-1",
    type: "logo",
    text: "SANEX COMPANY LTD",
    subheading: "Sustainable Liquid Waste Management · Rwanda",
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
];

export function compileBlocksToHtml(blocks: EmailBlock[] = INITIAL_SANEX_BLOCKS): string {
  const safeBlocks = Array.isArray(blocks) && blocks.length > 0 ? blocks : INITIAL_SANEX_BLOCKS;
  const renderedBlocks = safeBlocks
    .map((block) => {
      switch (block.type) {
        case "topbar":
          return `
            <tr>
              <td align="right" style="background-color:${block.bgColor || "#8DB833"}; padding:8px 24px; text-align:right;">
                <table border="0" cellpadding="0" cellspacing="0" style="display:inline-block; border-collapse:collapse;">
                  <tr>
                    <td style="padding:0 6px;">
                      <a href="https://x.com/SanexRwanda" target="_blank" style="text-decoration:none; display:inline-block; width:22px; height:22px; line-height:22px; text-align:center; background-color:#ffffff; color:#0f172a; border-radius:50%; font-size:11px; font-weight:bold;">𝕏</a>
                    </td>
                    <td style="padding:0 6px;">
                      <a href="https://linkedin.com/company/sanex-rwanda" target="_blank" style="text-decoration:none; display:inline-block; width:22px; height:22px; line-height:22px; text-align:center; background-color:#ffffff; color:#0a66c2; border-radius:50%; font-size:11px; font-weight:bold;">in</a>
                    </td>
                    <td style="padding:0 6px;">
                      <a href="https://youtube.com/@sanexrwanda" target="_blank" style="text-decoration:none; display:inline-block; width:22px; height:22px; line-height:22px; text-align:center; background-color:#ffffff; color:#ff0000; border-radius:50%; font-size:10px; font-weight:bold;">▶</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          `;

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

        case "footer":
          return `
            <tr>
              <td align="center" style="background-color:#0f172a; color:#94a3b8; padding:32px 24px; text-align:center; font-size:11px; line-height:1.6;">
                <p style="color:#8DB833; font-weight:800; font-size:12px; margin:0 0 6px 0; text-transform:uppercase; letter-spacing:1px;">
                  SANEX COMPANY LTD
                </p>
                <p style="margin:0 0 10px 0;">
                  KN 3 Rd, Kigali, Rwanda · Sustainable Liquid Waste & Sanitation
                </p>
                <p style="margin:0;">
                  Questions? Reach us directly at <a href="mailto:info@sanex.rw" style="color:#ffffff; text-decoration:underline;">info@sanex.rw</a> or +250 788 300 000.
                </p>
              </td>
            </tr>
          `;

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
      .sanex-col-cell {
        padding: 20px 16px !important;
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
    .mobile-forced .sanex-col-cell {
      padding: 20px 16px !important;
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

export function EmailStudioBuilder({
  initialHtml,
  initialBlocks,
  onSaveAndProceed,
  onBackToSending,
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingUploadTargetRef = useRef<{ blockId: string; field: "col1Image" | "imageUrl" } | null>(null);

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
      case "footer":
        newBlock = { id: newId, type: "footer" };
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

  const triggerImageUpload = (blockId: string, field: "col1Image" | "imageUrl") => {
    pendingUploadTargetRef.current = { blockId, field };
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && pendingUploadTargetRef.current) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const rawDataUrl = uploadEvent.target?.result as string;
        const { blockId, field } = pendingUploadTargetRef.current!;

        // Compress and scale down large images to prevent QuotaExceededError in storage and keep email lightweight
        const img = new Image();
        img.onload = () => {
          const MAX_DIM = 800;
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
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            const compressed = canvas.toDataURL("image/jpeg", 0.82);
            const updated = blocks.map((b) => (b.id === blockId ? { ...b, [field]: compressed } : b));
            commitBlocks(updated);
            return;
          }
          const updated = blocks.map((b) => (b.id === blockId ? { ...b, [field]: rawDataUrl } : b));
          commitBlocks(updated);
        };
        img.onerror = () => {
          const updated = blocks.map((b) => (b.id === blockId ? { ...b, [field]: rawDataUrl } : b));
          commitBlocks(updated);
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
            onClick={() => onSaveAndProceed(compiledHtml, blocks)}
            className="h-8 text-xs font-extrabold bg-[#8DB833] text-black hover:bg-[#8DB833]/90 gap-1.5 shadow-xs"
          >
            <span>Save & Send</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* STUDIO BODY */}
      <div className="flex-1 flex overflow-hidden">
        {/* FAR LEFT NAVIGATION RAIL */}
        <div className="w-14 bg-white border-r flex flex-col items-center py-3 gap-4 shrink-0 z-20">
          <button
            type="button"
            onClick={() => setActiveTab("blocks")}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold p-1.5 rounded-lg transition-colors w-11 ${
              activeTab === "blocks"
                ? "text-teal-600 bg-teal-50 border-r-2 border-teal-600"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Grid className="h-5 w-5" />
            <span>Blocks</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("sections")}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold p-1.5 rounded-lg transition-colors w-11 ${
              activeTab === "sections"
                ? "text-teal-600 bg-teal-50"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Layers className="h-5 w-5" />
            <span>Sections</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("styles")}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold p-1.5 rounded-lg transition-colors w-11 ${
              activeTab === "styles"
                ? "text-teal-600 bg-teal-50"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Palette className="h-5 w-5" />
            <span>Styles</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("optimize")}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold p-1.5 rounded-lg transition-colors w-11 ${
              activeTab === "optimize"
                ? "text-teal-600 bg-teal-50"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Gauge className="h-5 w-5" />
            <span>Optimize</span>
          </button>
        </div>

        {/* LEFT BLOCKS DRAWER */}
        <div className="w-72 bg-white border-r overflow-y-auto p-4 flex flex-col gap-6 shrink-0 z-10">
          <div className="space-y-2.5">
            <div>
              <h3 className="text-xs font-bold text-slate-900 m-0">Content blocks</h3>
              <p className="text-[11px] text-slate-500 m-0">Click or drag to add content to your email</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
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

            return (
              <div className="p-3 bg-slate-50 border rounded-lg space-y-2.5 mt-auto">
                <span className="text-[10px] font-extrabold uppercase text-slate-500">
                  Selected: {block.type}
                </span>

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

                <p className="text-[11px] text-slate-600 m-0">
                  Click directly on any text or button inside the canvas to edit in place.
                </p>
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

                    {block.type === "topbar" && (
                      <div
                        style={{ backgroundColor: block.bgColor || "#8DB833" }}
                        className="py-2 px-6 flex items-center justify-end gap-2 text-white"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-white text-slate-900 flex items-center justify-center text-[10px] font-black">
                            𝕏
                          </span>
                          <span className="w-5 h-5 rounded-full bg-white text-[#0a66c2] flex items-center justify-center text-[10px] font-black">
                            in
                          </span>
                          <span className="w-5 h-5 rounded-full bg-white text-red-600 flex items-center justify-center text-[9px] font-black">
                            ▶
                          </span>
                        </div>
                      </div>
                    )}

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
                                  className="rounded-lg object-cover w-full shadow-2xs"
                                />

                                <button
                                  type="button"
                                  onClick={() => triggerImageUpload(block.id, "col1Image")}
                                  className="absolute bottom-2 left-2 bg-slate-900/80 hover:bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 shadow-xs opacity-0 group-hover/img:opacity-100 transition-opacity"
                                >
                                  <Upload className="h-3 w-3" /> Replace / Upload
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
                                  className="rounded-md object-cover max-w-full shadow-2xs"
                                />

                                <button
                                  type="button"
                                  onClick={() => triggerImageUpload(block.id, "col1Image")}
                                  className="absolute bottom-2 left-2 bg-slate-900/80 hover:bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 shadow-xs opacity-0 group-hover/img:opacity-100 transition-opacity"
                                >
                                  <Upload className="h-3 w-3" /> Replace / Upload
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
                            className="rounded-md max-w-full inline-block shadow-xs"
                          />

                          <button
                            type="button"
                            onClick={() => triggerImageUpload(block.id, "imageUrl")}
                            className="absolute bottom-2 left-2 bg-slate-900/80 hover:bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 shadow-xs opacity-0 group-hover/img:opacity-100 transition-opacity"
                          >
                            <Upload className="h-3 w-3" /> Upload / Replace
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

                    {block.type === "footer" && (
                      <div className="py-6 px-6 bg-[#0f172a] text-slate-400 text-center text-[11px] leading-relaxed space-y-1">
                        <div className="font-extrabold text-[#8DB833] text-xs uppercase tracking-wider">
                          SANEX COMPANY LTD
                        </div>
                        <p className="m-0 text-slate-400">
                          KN 3 Rd, Kigali, Rwanda · Sustainable Liquid Waste & Sanitation
                        </p>
                        <p className="m-0 text-slate-500 text-[10px]">
                          info@sanex.rw · +250 788 300 000
                        </p>
                      </div>
                    )}
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
              srcDoc={compiledHtml}
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
