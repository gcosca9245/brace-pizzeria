export type Category = 'pizza' | 'antipasti' | 'dolci' | 'getraenke';

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'pizza', label: 'Pizza' },
  { id: 'antipasti', label: 'Antipasti' },
  { id: 'dolci', label: 'Dolci' },
  { id: 'getraenke', label: 'Getränke' },
];

export type Tag = 'vegetarisch' | 'vegan' | 'scharf' | 'neu';

export type MenuItem = {
  id: string;
  category: Category;
  name: string;
  /** Zutaten, so wie sie auf der Karte stehen */
  desc: string;
  /** Preis in Cent (Grundpreis, Ø 30 cm) */
  price: number;
  /** Dateiname ohne Endung unter /media/img */
  image?: string;
  tags: Tag[];
  /** Zutaten, die man abbestellen kann */
  removable: string[];
  available: boolean;
};

export const MENU: MenuItem[] = [
  {
    id: 'margherita',
    category: 'pizza',
    name: 'Margherita',
    desc: 'San-Marzano-Tomate, Fior di Latte, Basilikum, Olivenöl',
    price: 1150,
    image: 'p-margherita',
    tags: ['vegetarisch'],
    removable: ['Basilikum'],
    available: true,
  },
  {
    id: 'marinara',
    category: 'pizza',
    name: 'Marinara',
    desc: 'San-Marzano-Tomate, Knoblauch, wilder Oregano, Olivenöl',
    price: 950,
    image: 'p-marinara',
    tags: ['vegan'],
    removable: ['Knoblauch', 'Oregano'],
    available: true,
  },
  {
    id: 'diavola',
    category: 'pizza',
    name: 'Diavola',
    desc: 'Tomate, Fior di Latte, scharfe Salami Spianata, Chili-Honig, Basilikum',
    price: 1450,
    image: 'p-diavola',
    tags: ['scharf'],
    removable: ['Chili-Honig', 'Basilikum'],
    available: true,
  },
  {
    id: 'mortadella',
    category: 'pizza',
    name: 'Mortadella e Pistacchio',
    desc: 'Fior di Latte, Mortadella aus Bologna, Burrata, Pistazien, Zitronenabrieb',
    price: 1750,
    image: 'p-mortadella',
    tags: ['neu'],
    removable: ['Pistazien', 'Zitronenabrieb'],
    available: true,
  },
  {
    id: 'salsiccia',
    category: 'pizza',
    name: 'Salsiccia e Friarielli',
    desc: 'Tomate, Provola, Fenchel-Salsiccia, Friarielli, Chili',
    price: 1600,
    image: 'p-salsiccia',
    tags: ['scharf'],
    removable: ['Chili'],
    available: true,
  },
  {
    id: 'funghi',
    category: 'pizza',
    name: 'Funghi Bianca',
    desc: 'Fior di Latte, geräucherte Provola, Kräuterseitlinge, Maronen, Thymian, Parmesan',
    price: 1550,
    image: 'p-funghi',
    tags: ['vegetarisch'],
    removable: ['Maronen', 'Parmesan'],
    available: true,
  },
  {
    id: 'patate',
    category: 'pizza',
    name: 'Patate e Guanciale',
    desc: 'Fior di Latte, Kartoffel, Guanciale, Rosmarin, Meersalz',
    price: 1550,
    image: 'p-patate',
    tags: [],
    removable: ['Rosmarin'],
    available: true,
  },
  {
    id: 'formaggi',
    category: 'pizza',
    name: 'Quattro Formaggi',
    desc: 'Fior di Latte, Gorgonzola dolce, Provola, Pecorino, Walnuss, Honig',
    price: 1500,
    image: 'p-formaggi',
    tags: ['vegetarisch'],
    removable: ['Walnuss', 'Honig'],
    available: true,
  },
  {
    id: 'montanara',
    category: 'antipasti',
    name: 'Montanare',
    desc: 'Drei frittierte Teigtaschen, Tomate, Parmesan, Basilikum',
    price: 750,
    tags: ['vegetarisch'],
    removable: [],
    available: true,
  },
  {
    id: 'burrata',
    category: 'antipasti',
    name: 'Burrata',
    desc: 'Burrata aus Apulien, Ofentomaten, Basilikumöl, Pizzabrot',
    price: 1150,
    tags: ['vegetarisch'],
    removable: [],
    available: true,
  },
  {
    id: 'insalata',
    category: 'antipasti',
    name: 'Insalata di Finocchio',
    desc: 'Fenchel, Orange, Rucola, Oliven, Zitronendressing',
    price: 890,
    tags: ['vegan'],
    removable: [],
    available: true,
  },
  {
    id: 'tiramisu',
    category: 'dolci',
    name: 'Tiramisù',
    desc: 'Mascarpone, Savoiardi, Espresso aus Ehrenfeld, Kakao',
    price: 690,
    tags: ['vegetarisch'],
    removable: [],
    available: true,
  },
  {
    id: 'cannolo',
    category: 'dolci',
    name: 'Cannolo',
    desc: 'Ricotta, Pistazie, kandierte Orange',
    price: 450,
    tags: ['vegetarisch'],
    removable: [],
    available: true,
  },
  {
    id: 'limonata',
    category: 'getraenke',
    name: 'Limonata',
    desc: 'Zitronenlimonade aus Sizilien, 0,33 l',
    price: 390,
    tags: ['vegan'],
    removable: [],
    available: true,
  },
  {
    id: 'chinotto',
    category: 'getraenke',
    name: 'Chinotto',
    desc: 'Bitterorange, 0,33 l',
    price: 390,
    tags: ['vegan'],
    removable: [],
    available: true,
  },
  {
    id: 'koelsch',
    category: 'getraenke',
    name: 'Kölsch',
    desc: 'Flasche, 0,33 l, ab 16 Jahren',
    price: 350,
    tags: [],
    removable: [],
    available: true,
  },
  {
    id: 'rosso',
    category: 'getraenke',
    name: 'Aglianico rosso',
    desc: 'Kampanien, 0,75 l, ab 16 Jahren',
    price: 2600,
    tags: [],
    removable: [],
    available: true,
  },
];

/** Konfiguration für Pizzen */
export const SIZES = [
  { id: 'normal', label: 'Normal', hint: 'Ø 30 cm', delta: 0 },
  { id: 'ruota', label: 'Ruota', hint: 'Ø 36 cm', delta: 400 },
] as const;
export type SizeId = (typeof SIZES)[number]['id'];

export const DOUGHS = [
  { id: 'klassisch', label: 'Klassisch', hint: 'Tipo 1, 48 h gereift', delta: 0 },
  { id: 'vollkorn', label: 'Vollkorn-Sauerteig', hint: '72 h gereift', delta: 100 },
] as const;
export type DoughId = (typeof DOUGHS)[number]['id'];

export const EXTRAS = [
  { id: 'bufala', label: 'Büffelmozzarella', price: 300 },
  { id: 'burrata', label: 'Burrata', price: 450 },
  { id: 'nduja', label: '’Nduja', price: 250 },
  { id: 'rucola', label: 'Rucola', price: 150 },
  { id: 'sardellen', label: 'Sardellen', price: 200 },
  { id: 'oel', label: 'Chiliöl', price: 100 },
] as const;
export type ExtraId = (typeof EXTRAS)[number]['id'];

export const imageSrc = (name: string, w: 480 | 960 | 1280, ext: 'avif' | 'webp') => `/media/img/${name}-${w}.${ext}`;
