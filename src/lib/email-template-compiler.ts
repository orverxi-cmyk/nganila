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
    color: "#636679",
    bg: "#ffffff",
    defaultUrl: "https://x.com/NganiraRwanda",
    placeholder: "https://x.com/NganiraRwanda",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    iconText: "in",
    color: "#0A66C2",
    bg: "#ffffff",
    defaultUrl: "https://linkedin.com/company/nganira-company-ltd",
    placeholder: "https://linkedin.com/company/...",
  },
  {
    id: "youtube",
    name: "YouTube",
    iconText: "▶",
    color: "#FF0000",
    bg: "#ffffff",
    defaultUrl: "https://youtube.com/@nganirarwanda",
    placeholder: "https://youtube.com/@...",
  },
  {
    id: "facebook",
    name: "Facebook",
    iconText: "f",
    color: "#1877F2",
    bg: "#ffffff",
    defaultUrl: "https://facebook.com/nganirarwanda",
    placeholder: "https://facebook.com/...",
  },
  {
    id: "instagram",
    name: "Instagram",
    iconText: "📷",
    color: "#E4405F",
    bg: "#ffffff",
    defaultUrl: "https://instagram.com/nganirarwanda",
    placeholder: "https://instagram.com/...",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    iconText: "💬",
    color: "#25D366",
    bg: "#ffffff",
    defaultUrl: "https://wa.me/250788322428",
    placeholder: "https://wa.me/...",
  },
  {
    id: "website",
    name: "Official Website",
    iconText: "🌐",
    color: "#636679",
    bg: "#006400",
    defaultUrl: "https://nganira.rw",
    placeholder: "https://nganira.rw",
  },
];

export const DEFAULT_HEADER_SOCIALS: SocialLinkItem[] = [
  { id: "s-x", platform: "x", url: "https://x.com/NganiraRwanda", label: "𝕏", enabled: true },
  { id: "s-in", platform: "linkedin", url: "https://linkedin.com/company/nganira-company-ltd", label: "in", enabled: true },
  { id: "s-yt", platform: "youtube", url: "https://youtube.com/@nganirarwanda", label: "▶", enabled: true },
];

export function getSocialPlatformMeta(platform: SocialPlatform) {
  return (
    SOCIAL_PLATFORMS.find((p) => p.id === platform) || {
      id: platform,
      name: platform,
      iconText: "🔗",
      color: "#636679",
      bg: "#006400",
      defaultUrl: "https://nganira.rw",
      placeholder: "https://...",
    }
  );
}

export function parseVideoUrl(rawUrl?: string): {
  source: "youtube" | "vimeo" | "website" | "mp4" | "custom";
  thumbnailUrl: string;
  watchUrl: string;
} {
  const clean = (rawUrl || "").trim();
  if (!clean) {
    return {
      source: "website",
      thumbnailUrl:
        "https://firebasestorage.googleapis.com/v0/b/nganila-f3948.firebasestorage.app/o/uploads%2F1780321287848_B25A3099.jpg?alt=media",
      watchUrl: "https://nganira.rw/gallery",
    };
  }

  // YouTube match
  const ytMatch = clean.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      source: "youtube",
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
    };
  }

  // Direct MP4 or Firebase Storage media
  if (clean.includes("firebasestorage.googleapis.com") || /\.(mp4|webm|ogg|mov)($|\?)/i.test(clean)) {
    return {
      source: "mp4",
      thumbnailUrl:
        "https://firebasestorage.googleapis.com/v0/b/nganila-f3948.firebasestorage.app/o/uploads%2F1780321287848_B25A3099.jpg?alt=media",
      watchUrl: "https://nganira.rw/gallery",
    };
  }

  return {
    source: "custom",
    thumbnailUrl:
      "https://firebasestorage.googleapis.com/v0/b/nganila-f3948.firebasestorage.app/o/uploads%2F1780321287848_B25A3099.jpg?alt=media",
    watchUrl: clean.startsWith("http") ? clean : `https://nganira.rw${clean}`,
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
  buttonVariant?: "solid" | "outline" | "filled";
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
  col2HeadingColor?: string;
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
  videoWatchUrl?: string;
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
  // Company Header Properties
  companyName?: string;
  companyTagline?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  websiteUrl?: string;
  logoUrl?: string;
}

export const INITIAL_SANEX_BLOCKS: EmailBlock[] = [
  {
    id: "header-1",
    type: "header",
    companyName: "NGANIRA COMPANY LTD",
    companyTagline: "Sustainable Liquid Waste Management · Rwanda",
    companyAddress: "KK 31 Ave, Niboye, Kicukiro, Kigali, Rwanda",
    companyPhone: "+250 788 840 000",
    companyEmail: "info@nganira.rw",
    websiteUrl: "https://nganira.rw",
    logoUrl: "/images/logo.png",
    bgColor: "#636679",
    socialLinks: [...DEFAULT_HEADER_SOCIALS],
  },
  {
    id: "hero-1",
    type: "hero",
    heading: "",
    text: "Nganira Company LTD is a Rwandan company specializing in liquid waste management, emptying services, and clean water delivery.",
    buttonText: "BOOK SERVICE NOW >>",
    buttonUrl: "https://nganira.rw/book",
    buttonVariant: "filled",
    buttonColor: "#006400",
    buttonTextColor: "#ffffff",
    bgColor: "#ffffff",
  },
  {
    id: "col2-dwts",
    type: "columns_2",
    col1Width: 46,
    col2Width: 54,
    col1Image:
      "https://firebasestorage.googleapis.com/v0/b/nganila-f3948.firebasestorage.app/o/uploads%2F1779722491089_B25A3102.jpg?alt=media",
    col1ImageWidth: 260,
    col2Heading:
      "Installation and Management of Decentralized Wastewater Treatment Systems (DWTS)",
    col2HeadingColor: "#636679",
    col2Text:
      "We provide comprehensive DWTS solutions, from initial construction to ongoing management, designed to address the unique needs of communities and businesses lacking access to centralized wastewater infrastructure.",
    col2ButtonText: "Read More >>",
    col2ButtonUrl: "https://nganira.rw/services",
    col2ButtonColor: "#006400",
    col2ButtonTextColor: "#ffffff",
  },
  {
    id: "col2-clean-water",
    type: "columns_2",
    col1Width: 46,
    col2Width: 54,
    col1Image:
      "https://firebasestorage.googleapis.com/v0/b/nganila-f3948.firebasestorage.app/o/uploads%2F1779722938429_WhatsApp%20Image%202025-04-19%20at%2020.13.41.jpeg?alt=media",
    col1ImageWidth: 260,
    col2Heading: "Clean Water Delivery at Your Doorstep",
    col2HeadingColor: "#636679",
    col2Text:
      "Our portfolio also includes modern, clean water tank trucks. During water scarcity, we are a trusted partner for delivering clean water to your doorstep.",
    col2ButtonText: "Read More >>",
    col2ButtonUrl: "https://nganira.rw/services",
    col2ButtonColor: "#636679",
    col2ButtonTextColor: "#006400",
  },
  {
    id: "col2-liquid-waste",
    type: "columns_2",
    col1Width: 46,
    col2Width: 54,
    col1Image:
      "https://firebasestorage.googleapis.com/v0/b/nganila-f3948.firebasestorage.app/o/uploads%2F1779723894783_vlcsnap-2025-04-19-16h01m39s409.png?alt=media",
    col1ImageWidth: 260,
    col2Heading: "Liquid Waste Collection and Transport",
    col2HeadingColor: "#636679",
    col2Text:
      "Modern vacuum trucks for efficient waste collection, serving schools, hospitals, hotels, and commercial buildings.",
    col2ButtonText: "Read More >>",
    col2ButtonUrl: "https://nganira.rw/services",
    col2ButtonColor: "#636679",
    col2ButtonTextColor: "#006400",
  },
  {
    id: "video-highlights",
    type: "video",
    videoTitle: "Nganira Company LTD in Action: Operational Highlights",
    videoCaption:
      "Watch our specialized vacuum trucks and decentralized treatment systems providing essential sanitation services across Rwanda.",
    videoButtonText: "Watch Video",
    videoUrl: "https://nganira.rw/gallery",
    videoWatchUrl: "https://nganira.rw/gallery",
    videoThumbnail:
      "https://firebasestorage.googleapis.com/v0/b/nganila-f3948.firebasestorage.app/o/uploads%2F1780321287848_B25A3099.jpg?alt=media",
    videoPlayButtonColor: "#006400",
  },
  {
    id: "footer-1",
    type: "footer",
    recipientName: "{{email}}",
    recipientRole: "",
    organization: "",
    disclaimerContext:
      "You are receiving this official communication from Nganira Company LTD regarding environmental sanitation, liquid waste operations, and wastewater management in Rwanda.",
    showDisclaimer: true,
    unsubscribeUrl: "https://nganira.rw/unsubscribe",
    helpUrl: "https://nganira.rw/contact",
    privacyUrl: "https://nganira.rw/privacy",
  },
];

export function compileBlocksToHtml(blocks: EmailBlock[] = INITIAL_SANEX_BLOCKS): string {
  const safeBlocks = Array.isArray(blocks) && blocks.length > 0 ? blocks : INITIAL_SANEX_BLOCKS;
  const renderedBlocks = safeBlocks
    .map((block) => {
      switch (block.type) {
        case "header": {
          const companyName = block.companyName || "NGANIRA COMPANY LTD";
          const tagline = block.companyTagline || "Sustainable Liquid Waste Management · Rwanda";
          const address = block.companyAddress || "KK 31 Ave, Niboye, Kicukiro, Kigali, Rwanda";
          const phone = block.companyPhone || "+250 788 840 000";
          const email = block.companyEmail || "info@nganira.rw";
          const website = block.websiteUrl || "https://nganira.rw";
          const bgColor = block.bgColor || "#636679";
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
                                : `<div style="display:inline-block; width:44px; height:44px; border-radius:50%; border:2px solid #8DB833; background-color:#1e293b; text-align:center; line-height:40px; font-size:20px;">🚛</div>`
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
                            : `<div style="display:inline-block; width:44px; height:44px; border-radius:50%; border:2px solid #8DB833; background-color:#1e293b; text-align:center; line-height:40px; font-size:20px;">🚛</div>`
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
                      <span>✉️ <a href="mailto:${email}" style="color:#006400; text-decoration:none;">${email}</a></span>
                      <span style="color:#475569; margin:0 6px;">·</span>
                      <span>🌐 <a href="${website}" target="_blank" rel="noopener noreferrer" style="color:#006400; text-decoration:none;">nganira.rw</a></span>
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
                <div style="color:#636679; font-size:13px; font-weight:900; letter-spacing:2px; text-transform:uppercase; margin-top:4px;">
                  ${block.text || "NGANIRA COMPANY LTD"}
                </div>
                ${
                  block.subheading
                    ? `<div style="color:#64748b; font-size:10px; text-transform:uppercase; letter-spacing:1px; margin-top:2px;">${block.subheading}</div>`
                    : ""
                }
              </td>
            </tr>
          `;

        case "hero": {
          const showHeading = Boolean(block.heading && block.heading.trim());
          const isButtonFilled = block.buttonVariant === "filled" || block.buttonColor === "#8DB833" || Boolean(block.buttonColor);
          const btnBg = block.buttonColor || (isButtonFilled ? "#8DB833" : "transparent");
          const btnTextCol = block.buttonTextColor || (isButtonFilled ? "#000000" : "#ffffff");
          const btnBorder = isButtonFilled ? "none" : "1.5px solid #ffffff";
          const isWhiteBg = block.bgColor === "#ffffff" || block.bgColor === "#fff";
          const textColor = isWhiteBg ? "#334155" : "#cbd5e1";

          return `
            <tr>
              <td align="center" style="background-color:${block.bgColor || "#000000"}; padding:${showHeading ? "36px 28px" : "28px 24px"}; text-align:center;">
                ${
                  showHeading
                    ? `<h1 style="color:${isWhiteBg ? "#0f172a" : "#ffffff"}; font-size:20px; font-weight:900; letter-spacing:1.5px; text-transform:uppercase; margin:0 0 12px 0;">
                        ${block.heading}
                      </h1>`
                    : ""
                }
                <p style="color:${textColor}; font-size:14px; line-height:1.6; max-width:540px; margin:0 auto 20px auto; font-weight:500;">
                  ${block.text || ""}
                </p>
                ${
                  block.buttonText
                    ? `<a href="${block.buttonUrl || "#"}" target="_blank" style="display:inline-block; background-color:${btnBg}; border:${btnBorder}; color:${btnTextCol}; font-size:13px; font-weight:800; text-decoration:none; padding:12px 32px; border-radius:6px; letter-spacing:0.5px; text-transform:uppercase;">
                        ${block.buttonText}
                      </a>`
                    : ""
                }
              </td>
            </tr>
          `;
        }

        case "columns_2": {
          const leftW = block.col1Width || 48;
          const rightW = block.col2Width || 52;
          const headingColor = block.col2HeadingColor || "#8DB833";
          return `
            <tr>
              <td class="sanex-col-cell" style="background-color:#ffffff; padding:24px 20px; border-bottom:1px solid #f1f5f9;">
                <!-- DESKTOP 2-COLUMN VIEW (hidden on mobile <= 600px) -->
                <table class="sanex-desktop-col" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
                  <tr>
                    <td width="${leftW}%" valign="top" style="padding-right:16px;">
                      ${
                        block.col1Image
                          ? `<img src="${block.col1Image}" alt="${block.col2Heading || "Nganira Service"}" width="${block.col1ImageWidth || 260}" style="width:100%; max-width:${block.col1ImageWidth || 260}px; height:auto; border-radius:6px; display:block;" />`
                          : ""
                      }
                      ${block.col1Heading ? `<h3 style="color:#1e293b; font-size:15px; font-weight:800; margin:8px 0 6px 0;">${block.col1Heading}</h3>` : ""}
                      ${block.col1Text ? `<p style="color:#475569; font-size:12px; line-height:1.5; margin:0 0 10px 0;">${block.col1Text}</p>` : ""}
                    </td>
                    <td width="${rightW}%" valign="top" style="padding-left:8px;">
                      <h2 style="color:${headingColor}; font-size:16px; font-weight:800; line-height:1.35; margin:0 0 10px 0;">
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
                <!--[if !mso]><!-->
                <div class="sanex-mobile-col" style="display:none; max-height:0; overflow:hidden; mso-hide:all;">
                  ${
                    block.col2Heading
                      ? `<h2 style="color:${headingColor}; font-size:17px; font-weight:800; line-height:1.35; margin:0 0 12px 0;">
                          ${block.col2Heading}
                        </h2>`
                      : ""
                  }
                  ${
                    block.col1Image
                      ? `<div style="margin:0 0 14px 0; width:100%;">
                          <img src="${block.col1Image}" alt="${block.col2Heading || "Nganira Service"}" style="width:100%; max-width:100%; height:auto; border-radius:8px; display:block;" />
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
        }

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
                <img src="${block.imageUrl || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80"}" alt="${block.imageAlt || "Nganira"}" style="width:${block.imageWidth || "100%"}; max-width:100%; height:auto; border-radius:6px; display:inline-block;" />
              </td>
            </tr>
          `;

        case "button":
          return `
            <tr>
              <td align="${block.align || "center"}" style="background-color:#ffffff; padding:16px 24px;">
                <a href="${block.buttonUrl || "#"}" target="_blank" style="display:inline-block; background-color:${block.buttonColor || "#006400"}; color:${block.buttonTextColor || "#ffffff"}; font-size:13px; font-weight:800; text-decoration:none; padding:11px 28px; border-radius:6px; text-transform:uppercase; letter-spacing:0.5px;">
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
              : block.videoUrl?.trim() || parsed.watchUrl || "https://nganira.rw/gallery");
          const thumbnailUrl =
            block.videoThumbnail ||
            parsed.thumbnailUrl ||
            "https://firebasestorage.googleapis.com/v0/b/nganila-f3948.firebasestorage.app/o/uploads%2F1780321287848_B25A3099.jpg?alt=media";
          const title = block.videoTitle || "Nganira Company LTD in Action: Operational Highlights";
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

        case "code":
          return `
            <tr>
              <td style="background-color:#ffffff; padding:16px 24px;">
                ${block.rawHtml || ""}
              </td>
            </tr>
          `;

        case "footer": {
          const showDisc = block.showDisclaimer !== false;
          const contextText =
            block.disclaimerContext ||
            "You are receiving this official communication from Nganira Company LTD regarding environmental sanitation, liquid waste operations, and wastewater management in Rwanda.";
          const unsubsUrl = block.unsubscribeUrl || "https://nganira.rw/unsubscribe";
          const helpUrl = block.helpUrl || "https://nganira.rw/contact";
          const privacyUrl = block.privacyUrl || "https://nganira.rw/privacy";

          return `
            <tr>
              <td align="center" style="background-color:#0f172a; color:#94a3b8; padding:24px 20px; text-align:center; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:11px; line-height:1.55; border-top:1px solid #1e293b;">
                ${
                  showDisc
                    ? `
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
  <title>Nganira Campaign</title>
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
        padding: 18px 14px !important;
      }
      .sanex-video-bar {
        padding: 12px 14px !important;
      }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f1f5f9; padding:20px 0;">
    <tr>
      <td align="center">
        <!-- MAX-WIDTH 620PX CONTAINER -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:620px; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01); border:1px solid #e2e8f0; border-collapse:collapse;">
          ${renderedBlocks}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
