export type PlanId = "trial" | "monthly" | "semester";

export interface Plan {
  id: PlanId;
  name: string;
  price: string;
  priceCents: number;
  period: string;
  note: string;
  cta: string;
  popular?: boolean;
  quotas: { big: number; math: number; ocr: number; video: number; pdf: number };
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: "trial",
    name: "Trial",
    price: "$0.99",
    priceCents: 99,
    period: "7 days · one-time",
    note: "Card required. Auto-converts to $11.99/mo unless cancelled within 7 days.",
    cta: "Start $0.99 Trial",
    quotas: { big: 40, math: 30, ocr: 30, video: 30, pdf: 3 },
    features: ["40 big-model answers", "30 math solver calls", "30 OCR snips (image)", "30 video upload minutes", "3 PDF docs · max 20 pages each", "All 4 modes included", "1 trial per device / user"],
  },
  {
    id: "monthly",
    name: "Monthly",
    price: "$11.99",
    priceCents: 1199,
    period: "per month",
    note: "Soft cap ~15 big answers/day. Standard queue speed.",
    cta: "Subscribe Monthly",
    quotas: { big: 300, math: 200, ocr: 120, video: 180, pdf: 20 },
    features: ["300 big-model answers / mo", "200 math solver calls / mo", "120 OCR snips / mo", "180 video minutes / mo", "20 PDF docs · up to 50 pages", "YouTube transcript Q&A unlimited", "All 4 modes included"],
  },
  {
    id: "semester",
    name: "Semester",
    price: "$29.99",
    priceCents: 2999,
    period: "3 months prepaid · $9.99/mo",
    note: "~17% cheaper than Monthly. Unused credits roll over inside the 3-month term.",
    cta: "Get Semester",
    popular: true,
    quotas: { big: 330, math: 220, ocr: 132, video: 198, pdf: 22 },
    features: ["330 big-model answers / mo", "220 math solver calls / mo", "132 OCR snips / mo", "198 video minutes / mo", "22 PDF docs / mo", "+10% boost + rollover in term", "Light priority queue boost"],
  },
];

export const ADDONS = [
  { id: "big100", label: "+100 Big-model answers", price: "$3", priceCents: 300, field: "bonusBig", amount: 100 },
  { id: "math100", label: "+100 Math calls", price: "$2", priceCents: 200, field: "bonusMath", amount: 100 },
  { id: "ocr200", label: "+200 OCR snips", price: "$1", priceCents: 100, field: "bonusOcr", amount: 200 },
  { id: "video120", label: "+120 Video minutes", price: "$3", priceCents: 300, field: "bonusVideo", amount: 120 },
] as const;

export function planById(id: string): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}

export const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "es", label: "Spanish", native: "Español" },
  { code: "fr", label: "French", native: "Français" },
  { code: "pt", label: "Portuguese", native: "Português" },
  { code: "ru", label: "Russian", native: "Русский" },
  { code: "ar", label: "Arabic", native: "العربية" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "zh", label: "Chinese Simplified", native: "简体中文" },
  { code: "de", label: "German", native: "Deutsch" },
  { code: "ja", label: "Japanese", native: "日本語" },
  { code: "id", label: "Indonesian", native: "Bahasa Indonesia" },
];
