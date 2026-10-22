import type { Product } from "@/lib/types";

const CANONICAL_NAMES: Record<string, string> = {
  "212 NY masculino": "212 NY Masculino",
  "212 vip hombre": "212 VIP Masculino",
  "212 vip rose": "212 VIP Rosé",
  "althair de Marly": "Althaïr de Marly",
  "amber oud dubai Night": "Amber Oud Aqua Dubai",
  "angham second": "Angham Second Song",
  "aqua di Gio femenino": "Acqua di Giò Femenino",
  "aqua di Gio masculino": "Acqua di Giò Masculino",
  "asad": "Asad",
  "asad borboun": "Asad Bourbon",
  "asad sanzibar": "Asad Zanzibar",
  "Baccarat rouget": "Baccarat Rouge 540",
  "bad boy dazzling": "Bad Boy Dazzling Garden",
  "Black xs aphrodisiaque": "Black XS L'Aphrodisiaque",
  "Black xs femenino": "Black XS Femenino",
  "Black xs masculino": "Black XS Masculino",
  "Bombshell Nígths": "Bombshell Nights",
  "ch Carolina herrera femenino": "CH Femenino",
  "Chanel 5": "Chanel N°5",
  "choco overdose": "Choco Overdose",
  "cloud": "Cloud",
  "club de nuit bling": "Club de Nuit Bling",
  "CLUB DE NUIT INTENSE": "Club de Nuit Intense",
  "cred aventus": "Creed Aventus",
  "devotion intens": "Devotion Intense",
  "DunesCape": "Dunescape",
  "eclayre": "Eclaire",
  "eclayre pistachio": "Eclaire Pistachio",
  "faharenheit dior": "Fahrenheit Dior",
  "fame in love": "Fame in Love",
  "goo mango": "Goo Mango",
  "invictus legend": "Invictus Legend",
  "J adore Dior": "J'adore Dior",
  "Kamrha hawa": "Khamrah Hawa",
  "kin of seducción": "King of Seduction",
  "L Interdit": "L'Interdit",
  "la vida es bella elixit": "La Vie Est Belle L'Elixir",
  "LADY MILLION RABANNE": "Lady Million Rabanne",
  "le beau": "Le Beau",
  "le male elixir absolut": "Le Male Elixir Absolu",
  "le male paradisen garden": "Le Male Paradise Garden",
  "libre berry crush": "Libre Berry Crush",
  "ligth blue femenino": "Light Blue Femenino",
  "ligth blue masculino": "Light Blue Masculino",
  "mandaryn ski": "Mandarin Sky",
  "mandaryn ski elixir": "Mandarin Sky Elixir",
  "marshmalow": "Marshmallow",
  "Moschino toy boy": "Moschino Toy Boy",
  "most wanted": "Most Wanted",
  "Myself": "MYSLF",
  "NAXOS XERJOFF": "Naxos Xerjoff",
  "nueve pm Night out": "9 PM Night Out",
  "Olympia": "Olympea",
  "OMBRE LEATHER TOM FORD": "Ombre Leather Tom Ford",
  "oud for glory": "Oud for Glory",
  "power seducción": "Power of Seduction",
  "PURE XS RABANNE": "Pure XS Rabanne",
  "SAUVAGE ELIXIR": "Sauvage Elixir",
  "scandal femenino": "Scandal Femenino",
  "scandal masculino": "Scandal Masculino",
  "silver Mountain": "Silver Mountain Water",
  "stronger with you": "Stronger With You",
  "stronger with you sandalwood": "Stronger With You Sandalwood",
  "the most wanted": "The Most Wanted",
  "the most wanted intens": "The Most Wanted Intense",
  "the one masculino": "The One Masculino",
  "valentino extradose": "Valentino Born in Roma Extradose",
  "valentino extravaganza": "Valentino Born in Roma Green Stravaganza",
  "valentino intens": "Valentino Born in Roma Intense",
  "victoria": "Victoria",
  "yara rosa": "Yara Rosa",
};

export function canonicalProductName(name: string) {
  return CANONICAL_NAMES[name] ?? name.trim();
}

const INSPIRATION_EXCLUSIONS = new Set(["Khamrah Hawa", "Most Wanted"]);

export function verifiedInspiration(photoUrl: string | null, productName?: string) {
  if (productName && INSPIRATION_EXCLUSIONS.has(productName)) return null;
  if (!photoUrl?.startsWith("/product-images/")) return null;
  const filename = decodeURIComponent(photoUrl.slice("/product-images/".length)).replace(/\.[^.]+$/, "");
  const separator = filename.lastIndexOf(" - ");
  if (separator < 1) return null;
  const fragrance = filename.slice(0, separator).trim();
  const brand = filename.slice(separator + 3).trim();
  if (!fragrance || !brand) return null;
  return `${fragrance} — ${brand}`;
}

function tubitoPhotoUrl(name: string) {
  const assetName = name.replace(/^Odrssay\b/, "Odyssey");
  const slug = assetName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `/tubitos-arabes/${slug}.jpeg`;
}

export function enrichProduct(product: Product): Product {
  const catalogSection = product.catalog_section ?? "extractos";
  const canonicalName = canonicalProductName(product.name);
  const name = catalogSection === "tubitos_arabes"
    ? canonicalName.replace(/^Odyssey\b/, "Odrssay")
    : canonicalName;
  const photoUrl = product.photo_url ?? (catalogSection === "tubitos_arabes" ? tubitoPhotoUrl(name) : null);
  return {
    ...product,
    name,
    photo_url: photoUrl,
    catalog_section: catalogSection,
    inspired_by: verifiedInspiration(photoUrl, name),
  };
}

export function activeInventorySummary(products: Product[]) {
  const active = products.filter((product) => product.is_active);
  return {
    products: active.length,
    units: active.reduce((sum, product) => sum + product.stock, 0),
    lowStock: active.filter((product) => product.stock > 0 && product.stock <= product.min_stock).length,
  };
}
