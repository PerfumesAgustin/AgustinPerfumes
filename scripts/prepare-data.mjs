import { readFile, writeFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = JSON.parse(await readFile(resolve(root, "data/inventory-source.json"), "utf8"));
const imageNames = new Set(await readdir(resolve(root, "public/product-images")));

// Vinculaciones revisadas una por una. No se usan coincidencias aproximadas.
const photos = {
  "1 Million": "1 Million - Rabanne.jpeg",
  "1 Million Elixir": "1 Million Elixir - Rabanne.jpeg",
  "1 Million Lucky": "1 Million Lucky - Rabanne.jpeg",
  "212 Men": "212 Men - Carolina Herrera.jpeg",
  "212 Sexy": "212 Sexy - Carolina Herrera.jpeg",
  "212 VIP": "212 VIP Femenino - Carolina Herrera.jpeg",
  "212 VIP Black": "212 VIP Black - Carolina Herrera.jpeg",
  "9 PM": "9PM - Afnan.jpeg",
  "9 PM Rebel": "9PM Rebel - Afnan.jpeg",
  "A Men Mugler": "A Men - Mugler.jpeg",
  "Acqua di Gio Profumo": "Acqua di Gio Profumo - Armani.jpeg",
  Alien: "Alien - Mugler.jpeg",
  "Amber Gold Xerjoff": "Amber Gold - Xerjoff.jpeg",
  "Amber Oud Gold": "Amber Oud Gold Edition - Al Haramain.jpeg",
  "Amber Oud Private Edition": "Amber Oud Private Edition - Al Haramain.jpeg",
  "Amor Amor": "Amor Amor - Cacharel.jpeg",
  "Ange ou Demon": "Ange ou Demon - Givenchy.jpeg",
  "Angel Fantasm": "Angel Fantasm - Mugler.jpeg",
  "Angel Mugler": "Angel - Mugler.jpeg",
  "Angel Nova": "Angel Nova - Mugler.jpeg",
  "Arabians Tonka Montale": "Arabians Tonka - Montale.jpeg",
  Atlas: "Atlas - Lattafa.jpeg",
  "Bad Boy": "Bad Boy - Carolina Herrera.jpeg",
  "Bharara King": "Bharara King - Bharara.jpeg",
  "Black Opium": "Black Opium - Yves Saint Laurent.jpeg",
  "Bleu de Chanel": "Bleu de Chanel - Chanel.jpeg",
  "Bombon Viktor Rolf": "Bonbon - Viktor & Rolf.jpeg",
  "Born in Roma Green Stravaganza": "Valentino Born in Roma Green Stravaganza - Valentino.jpeg",
  "Burberry Her": "Burberry Her - Burberry.jpeg",
  "Bvlgari Man in Black": "Man in Black - Bvlgari.jpeg",
  "CH Men": "CH Men - Carolina Herrera.jpeg",
  "CH Very Good Girl": "Very Good Girl - Carolina Herrera.jpeg",
  "CK One": "CK One - Calvin Klein.jpeg",
  "Chanel 5": "Chanel N°5 - Chanel.jpeg",
  "Cool Water": "Cool Water - Davidoff.jpeg",
  "DKNY Be Delicious": "DKNY Be Delicious - DKNY.jpeg",
  "Dior Homme": "Dior Homme - Dior.jpeg",
  DunesCape: "Dunescape - Armaf.jpeg",
  "Elixir Shakira": "Elixir Shakira - Shakira.jpeg",
  "Eros Flame": "Eros Flame - Versace.jpeg",
  "Eros Versace": "Eros - Versace.jpeg",
  Eternity: "Eternity - Calvin Klein.jpeg",
  Euphoria: "Euphoria - Calvin Klein.jpeg",
  Fame: "Fame - Rabanne.jpeg",
  "Flower Kenzo": "Flower by Kenzo - Kenzo.jpeg",
  "Giorgio Armani My Way": "My Way - Armani.jpeg",
  "Giorgio Armani Si": "Si - Giorgio Armani.jpeg",
  Goodness: "Goddess Burberry - Burberry.jpeg",
  "Hugo Boss": "Hugo - Hugo Boss.jpeg",
  "Imagination Louis Vuitton": "Imagination - Louis Vuitton.jpeg",
  Invictus: "Invictus - Rabanne.jpeg",
  "Invictus Aqua": "Invictus Acqua - Rabanne.jpeg",
  "Invictus Platinum": "Invictus Platinum - Rabanne.jpeg",
  "Invictus Victory Elixir": "Invictus Victory Elixir - Rabanne.jpeg",
  "Issey Miyake L Eau d Issey": "L'Eau d'Issey - Issey Miyake.jpeg",
  "J adore Dior": "J'adore - Dior.jpeg",
  "Kenzo Homme": "Kenzo Homme - Kenzo.jpeg",
  "Khamrah Qahwa": "Khamrah Qahwa - Lattafa.jpeg",
  "L Interdit": "L'Interdit - Givenchy.jpeg",
  "La Bomba": "La Bomba - Carolina Herrera.jpeg",
  "La Vie Est Belle": "La Vie Est Belle - Lancôme.jpeg",
  "Le Male": "Le Male - Jean Paul Gaultier.jpeg",
  "Le Male Elixir": "Le Male Elixir - Jean Paul Gaultier.jpeg",
  "Le Male Le Parfum": "Le Male Le Parfum - Jean Paul Gaultier.jpeg",
  Libre: "Libre - Yves Saint Laurent.jpeg",
  "Liquid Brun": "Liquid Brun - French Avenue.jpeg",
  "Lost Cherry Tom Ford": "Lost Cherry - Tom Ford.jpeg",
  "Miss Dior": "Miss Dior - Dior.jpeg",
  Myself: "MYSLF - Yves Saint Laurent.jpeg",
  "Noble Blush": "Noble Blush - Lattafa.jpeg",
  Olympia: "Olympea - Rabanne.jpeg",
  "Ombre Nomade": "Ombre Nomade - Louis Vuitton.jpeg",
  "Paco Rabanne Phantom": "Phantom - Rabanne.jpeg",
  Phantom: "Phantom - Rabanne.jpeg",
  "Polo Black": "Polo Black - Ralph Lauren.jpeg",
  "Polo Blue": "Polo Blue - Ralph Lauren.jpeg",
  "Polo Red": "Polo Red - Ralph Lauren.jpeg",
  "Power of You": "Power of You - Giorgio Armani.jpeg",
  Ralph: "Ralph - Ralph Lauren.jpeg",
  "Rock Shakira": "Rock Shakira - Shakira.jpeg",
  "Sauvage Dior": "Sauvage - Dior.jpeg",
  "Si Giorgio Armani": "Si - Giorgio Armani.jpeg",
  Spicebomb: "Spicebomb - Viktor & Rolf.jpeg",
  "Stronger With You Intensely": "Stronger With You Intensely - Giorgio Armani.jpeg",
  Sublime: "Sublime - Lattafa.jpeg",
  "Sweet Like Candy": "Sweet Like Candy - Ariana Grande.jpeg",
  "The Most Wanted Azzaro": "The Most Wanted - Azzaro.jpeg",
  "The Only One": "The Only One - Dolce & Gabbana.jpeg",
  "Tobacco Vanille": "Tobacco Vanille - Tom Ford.jpeg",
  Tommy: "Tommy - Tommy Hilfiger.jpeg",
  "Tommy Girl": "Tommy Girl - Tommy Hilfiger.jpeg",
  "Toy 2": "Toy 2 - Moschino.jpeg",
  "Toy 2 Bubble Gum": "Toy 2 Bubble Gum - Moschino.jpeg",
  "Ultra Male": "Ultra Male - Jean Paul Gaultier.jpeg",
  "Valentino Born in Roma": "Valentino Born in Roma Masculino - Valentino.jpeg",
  "Valentino Born in Roma Intense": "Valentino Uomo Born in Roma Intense - Valentino.jpeg",
  "Vanilla Freak": "Vanilla Freak - Lattafa.jpeg",
  "Very Good Girl": "Very Good Girl - Carolina Herrera.jpeg",
  "Very Irresistible": "Very Irresistible - Givenchy.jpeg",
  "Y Eau de Parfum": "Y Eau de Parfum - Yves Saint Laurent.jpeg",
  "Y Elixir Yves Saint Laurent": "Y Elixir - Yves Saint Laurent.jpeg",
  Yara: "Yara - Lattafa.jpeg",
  "Yara Candy": "Yara Candy - Lattafa.jpeg",
  "Yara Elixir": "Yara Elixir - Lattafa.jpeg",
  "scandal femenino": "Scandal Femenino - Jean Paul Gaultier.jpeg",
  "Kamrha hawa": "Khamrah Qahwa - Lattafa.jpeg",
  "ligth blue masculino": "Light Blue Masculino - Dolce & Gabbana.jpeg",
  "the one masculino": "The One - Dolce & Gabbana.jpeg",
  "ligth blue femenino": "Light Blue Femenino - Dolce & Gabbana.jpeg",
  "amber oud dubai Night": "Amber Oud Aqua Dubai - Al Haramain.jpeg",
  "kin of seducción": "King of Seduction - Antonio Banderas.jpeg",
  "la vida es bella elixit": "La Vie Est Belle L'Elixir - Lancôme.jpeg",
  asad: "Asad - Lattafa.jpeg",
  "armani code femenino": "Armani Code Femenino - Armani.jpeg",
  "le male elixir absolut": "Le Male Elixir Absolu - Jean Paul Gaultier.jpeg",
  "the most wanted": "The Most Wanted - Azzaro.jpeg",
  "nueve pm Night out": "9 PM Night Out - Afnan.jpeg",
  "Black xs aphrodisiaque": "Black XS L'Aphrodisiaque Masculino - Rabanne.jpeg",
  "valentino extravaganza": "Valentino Born in Roma Green Stravaganza - Valentino.jpeg",
  "invictus legend": "Invictus Legend - Rabanne.jpeg",
  "valentino extradose": "Born in Roma Extradose Masculino - Valentino.jpeg",
  "club de nuit bling": "Club de Nuit Bling - Armaf.jpeg",
  "scandal masculino": "Scandal Masculino - Jean Paul Gaultier.jpeg",
  "mandaryn ski": "Mandarin Sky - Armaf.jpeg",
  "faharenheit dior": "Fahrenheit - Dior.jpeg",
  "althair de Marly": "Althaïr - Parfums de Marly.jpeg",
  "most wanted": "The Most Wanted - Azzaro.jpeg",
  "Moschino toy boy": "Toy Boy - Moschino.jpeg",
  "212 vip hombre": "212 VIP Masculino - Carolina Herrera.jpeg",
  "Black xs masculino": "Black XS Masculino - Rabanne.jpeg",
  "stronger with you sandalwood": "Stronger With You Sandalwood - Giorgio Armani.jpeg",
  "le beau": "Le Beau - Jean Paul Gaultier.jpeg",
  "angham second": "Angham Second Song - Lattafa.jpeg",
  "power seducción": "Power of Seduction - Antonio Banderas.jpeg",
  "asad borboun": "Asad Bourbon - Lattafa.jpeg",
  "oud for glory": "Oud for Glory - Lattafa.jpeg",
  "bad boy dazzling": "Bad Boy Dazzling Garden - Carolina Herrera.jpeg",
  "mandaryn ski elixir": "Mandarin Sky Elixir - Armaf.jpeg",
  "Baccarat rouget": "Baccarat Rouge 540 - Maison Francis Kurkdjian.jpeg",
  "yara rosa": "Yara - Lattafa.jpeg",
  "212 vip rose": "212 VIP Rose - Carolina Herrera.jpeg",
  "libre berry crush": "Libre Berry Crush - Yves Saint Laurent.jpeg",
  cloud: "Cloud - Ariana Grande.jpeg",
  "choco overdose": "Choco Overdose - Lattafa.jpeg",
  eclayre: "Eclaire - Lattafa.jpeg",
  "silver Mountain": "Silver Mountain Water - Creed.jpeg",
  "Bombshell Nígths": "Bombshell Nights - Victoria's Secret.jpeg",
  "ch Carolina herrera femenino": "CH Femenino - Carolina Herrera.jpeg",
  "Black xs femenino": "Black XS Femenino - Rabanne.jpeg",
  "aqua di Gio femenino": "Acqua di Gio Femenino - Armani.jpeg",
  "fame in love": "Fame in Love - Rabanne.jpeg",
};

const femaleMarkers = [
  "Femenino", "212 Sexy -", "212 VIP Rose", "Angel", "Alien", "Amor Amor", "Angham Second Song",
  "Ange ou Demon", "Black Opium", "Bombshell Nights", "Bonbon",
  "Burberry Her", "Chanel N°5", "Cloud", "DKNY", "Eclaire", "Elixir Shakira", "Euphoria",
  "Fame", "Flower", "Goddess", "Good Girl", "J'adore", "L'Interdit", "La Bomba", "La Vie", "Libre", "Miss Dior",
  "My Way", "Noble Blush", "Olympea", "Power of You", "Ralph -", "Rock Shakira", "Si -",
  "Sublime", "Sweet Like Candy", "The Only One", "Toy 2", "Vanilla Freak", "Very Good Girl",
  "Very Irresistible", "Yara", "Tommy Girl", "Choco Overdose",
];
const unisexMarkers = [
  "Amber", "Arabians Tonka", "Atlas", "Baccarat", "CK One", "Dunescape",
  "Khamrah", "Lost Cherry", "Oud ", "Silver Mountain Water", "Tobacco Vanille",
];

const correctedNames = {
  Goodness: "Goddess Burberry",
};

function genderFor(image) {
  if (!image) return "Sin clasificar";
  if (unisexMarkers.some((marker) => image.includes(marker))) return "Unisex";
  if (femaleMarkers.some((marker) => image.includes(marker))) return "Femenino";
  return "Masculino";
}

for (const image of Object.values(photos)) {
  if (!imageNames.has(image)) throw new Error(`No existe la foto validada: ${image}`);
}

const prepared = source.map((product) => {
  const image = photos[product.name] ?? null;
  return {
    id: Number(product.id),
    name: correctedNames[product.name] ?? product.name,
    source_name: product.original_name ?? product.name,
    gender: genderFor(image),
    stock: Number(product.stock),
    min_stock: 3,
    photo_url: image ? `/product-images/${encodeURIComponent(image)}` : null,
    is_active: true,
    data_status: image ? "foto_validada" : "revisar",
  };
});

await writeFile(resolve(root, "data/seed-products.json"), JSON.stringify(prepared, null, 2) + "\n");

const sqlString = (value) => value == null ? "null" : `'${String(value).replaceAll("'", "''")}'`;
const rows = prepared.map((product) =>
  `(${product.id}, ${sqlString(product.name)}, ${sqlString(product.source_name)}, ${sqlString(product.gender)}, ${product.stock}, ${product.min_stock}, ${sqlString(product.photo_url)}, ${product.is_active}, ${sqlString(product.data_status)})`,
);
const seedSql = `-- Generado desde el inventario original: 204 registros, 900 unidades.\n` +
  `-- No fusiona duplicados ni inventa cantidades.\n` +
  `insert into public.products (id, name, source_name, gender, stock, min_stock, photo_url, is_active, data_status) values\n${rows.join(",\n")}\n` +
  `on conflict (id) do update set name=excluded.name, source_name=excluded.source_name, gender=excluded.gender, stock=excluded.stock, min_stock=excluded.min_stock, photo_url=excluded.photo_url, is_active=excluded.is_active, data_status=excluded.data_status;\n\n` +
  `select setval(pg_get_serial_sequence('public.products','id'), (select max(id) from public.products));\n`;
await writeFile(resolve(root, "supabase/seed.sql"), seedSql);

const linked = prepared.filter((product) => product.photo_url).length;
const totalStock = prepared.reduce((sum, product) => sum + product.stock, 0);
console.log(JSON.stringify({ products: prepared.length, totalStock, linkedPhotos: linked, pendingPhotos: prepared.length - linked }, null, 2));
