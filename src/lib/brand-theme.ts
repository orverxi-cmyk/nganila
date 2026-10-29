export interface BrandSettings {
  siteName: string;
  companyName: string;
  tagline: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  darkColor: string;
  logoUrl: string;
  logoWidth: number;
  logoHeight: number;
  logoSpacing: number;
  phones: string[];
  phone?: string;
  emails: string[];
  email?: string;
  socials: {
    twitter?: string;
    linkedin?: string;
    facebook?: string;
    instagram?: string;
    whatsapp?: string;
    youtube?: string;
  };
  navLinks?: Array<{ name: string; href: string }>;
  updatedAt?: number;
}

export const DEFAULT_BRAND_SETTINGS: BrandSettings = {
  siteName: "NGANIRA COMPANY LTD",
  companyName: "NGANIRA COMPANY LTD",
  tagline: "Waste Water Management",
  description: "Nganira Company LTD is a professional waste water management company operating in Kicukiro, Kigali, Rwanda.",
  primaryColor: "#006400",
  secondaryColor: "#636679",
  darkColor: "#26272e",
  logoUrl: "",
  logoWidth: 160,
  logoHeight: 44,
  logoSpacing: 8,
  phones: ["+250 788 450 120", "+250 788 303 628"],
  phone: "+250 788 450 120",
  emails: ["info@nganira.rw"],
  email: "info@nganira.rw",
  socials: {
    twitter: "",
    linkedin: "",
    facebook: "",
    instagram: "",
    whatsapp: "+250788303628",
    youtube: "",
  },
};

/**
 * Converts a hex color string (#RRGGBB or #RGB) to Tailwind HSL format "H S% L%"
 */
export function hexToHsl(hex: string): string {
  let cleanHex = (hex || "").trim().replace("#", "");
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split("").map((c) => c + c).join("");
  }
  if (cleanHex.length !== 6) {
    // Default to #006400 HSL if invalid
    return "120 100% 19.6%";
  }

  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  const deg = Math.round(h * 360);
  const sat = Math.round(s * 100);
  const lum = Math.round(l * 1000) / 10;

  return `${deg} ${sat}% ${lum}%`;
}

/**
 * Converts a hex string to an RGB string "R, G, B"
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number; string: string } {
  let cleanHex = (hex || "").trim().replace("#", "");
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split("").map((c) => c + c).join("");
  }
  if (cleanHex.length !== 6) {
    return { r: 0, g: 100, b: 0, string: "0, 100, 0" };
  }

  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  return { r, g, b, string: `${r}, ${g}, ${b}` };
}

/**
 * Darkens a hex color by a factor between 0 and 1
 */
export function darkenHex(hex: string, amount: number = 0.15): string {
  const { r, g, b } = hexToRgb(hex);
  const factor = Math.max(0, Math.min(1, 1 - amount));
  const newR = Math.round(r * factor).toString(16).padStart(2, "0");
  const newG = Math.round(g * factor).toString(16).padStart(2, "0");
  const newB = Math.round(b * factor).toString(16).padStart(2, "0");
  return `#${newR}${newG}${newB}`;
}

/**
 * Generates dynamic root CSS stylesheet content for injecting brand colors
 */
export function generateBrandCss(settings: Partial<BrandSettings>): string {
  const primary = settings.primaryColor || DEFAULT_BRAND_SETTINGS.primaryColor;
  const secondary = settings.secondaryColor || DEFAULT_BRAND_SETTINGS.secondaryColor;
  const dark = settings.darkColor || DEFAULT_BRAND_SETTINGS.darkColor;

  const primaryHsl = hexToHsl(primary);
  const secondaryHsl = hexToHsl(secondary);
  const primaryRgb = hexToRgb(primary);
  const secondaryRgb = hexToRgb(secondary);
  const darkRgb = hexToRgb(dark);
  const primaryDark = darkenHex(primary, 0.18);

  return `
    :root {
      --primary: ${primaryHsl};
      --primary-foreground: 0 0% 100%;
      --accent: ${primaryHsl};
      --accent-foreground: 0 0% 100%;
      --ring: ${primaryHsl};
      --secondary: ${secondaryHsl};
      --secondary-foreground: 0 0% 100%;

      --brand-primary: ${primary};
      --brand-primary-rgb: ${primaryRgb.string};
      --brand-primary-dark: ${primaryDark};
      --brand-secondary: ${secondary};
      --brand-secondary-rgb: ${secondaryRgb.string};
      --brand-dark: ${dark};
      --brand-dark-rgb: ${darkRgb.string};
    }

    /* Global dynamic color mapping overrides */
    #slider,
    [id="slider"] {
      background-color: var(--brand-primary, #006400) !important;
    }
    [class*="bg-[#006400]"] {
      background-color: var(--brand-primary, #006400) !important;
    }
    [class*="bg-[#004d00]"],
    [class*="bg-[#005000]"],
    [class*="bg-[#004000]"] {
      background-color: var(--brand-primary-dark, #004d00) !important;
    }
    [class*="text-[#006400]"] {
      color: var(--brand-primary, #006400) !important;
    }
    [class*="border-[#006400]"] {
      border-color: var(--brand-primary, #006400) !important;
    }
    [class*="border-[#005000]"] {
      border-color: var(--brand-primary-dark, #005000) !important;
    }
    [class*="hover:bg-[#005000]"]:hover {
      background-color: var(--brand-primary-dark, #005000) !important;
    }
    [class*="from-[#006400]"] {
      --tw-gradient-from: var(--brand-primary, #006400) var(--tw-gradient-from-position) !important;
      --tw-gradient-to: var(--brand-primary-dark, #004600) var(--tw-gradient-to-position) !important;
      --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
    }
    [class*="via-[#005500]"] {
      --tw-gradient-via: var(--brand-primary, #006400) var(--tw-gradient-via-position) !important;
    }
    [class*="to-[#004600]"] {
      --tw-gradient-to: var(--brand-primary-dark, #004600) var(--tw-gradient-to-position) !important;
    }
    [class*="shadow-[#006400]/"] {
      --tw-shadow-color: rgba(var(--brand-primary-rgb, 0, 100, 0), 0.25) !important;
    }
    [class*="text-[#636679]"] {
      color: var(--brand-secondary, #636679) !important;
    }
    [class*="bg-[#26272e]"] {
      background-color: var(--brand-dark, #26272e) !important;
    }
  `.trim();
}

