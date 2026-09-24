export const CATEGORIES = [
  "cosmetics",
  "mens",
  "clothing",
  "tools",
  "shoes",
  "accessories",
  "home",
  "kids",
  "electronics",
  "sport",
  "beauty_health",
  "books_stationery",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABEL: Record<Category, string> = {
  cosmetics: "Косметика",
  mens: "Мужские товары",
  clothing: "Одежда",
  tools: "Инструменты",
  shoes: "Обувь",
  accessories: "Аксессуары",
  home: "Для дома",
  kids: "Детское",
  electronics: "Электроника",
  sport: "Спорт и отдых",
  beauty_health: "Здоровье и БАДы",
  books_stationery: "Книги и канцелярия",
};

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}

// Ordered: the first matching rule wins, so narrower categories (kids,
// shoes, sport) come before broad ones that share words with them
// ("детские кроссовки" is kids, "кроссовки для бега" is shoes).
const CATEGORY_RULES: [Category, RegExp][] = [
  ["kids", /детск|для детей|малыш|младен|подгузник|игрушк|коляск|школьн/],
  ["shoes", /кроссовк|кед[ыа]?\b|ботин|сапог|туфл|босонож|сандал|лофер|мокасин|слипон|шлепан|тапочк|сабо\b|обувь/],
  ["sport", /спортивн|фитнес|гантел|коврик для йог|велосипед|самокат|палатк|туристич|рюкзак для поход|мяч\b|тренаж|скакалк/],
  ["electronics", /смартфон|телефон|наушник|ноутбук|планшет|зарядн|кабел|колонк|часы умные|смарт-час|фитнес-браслет|пауэрбанк|power ?bank|клавиатур|мыш[ьи] компьют|телевизор|роутер|фен\b|стайлер|электрическ/],
  ["tools", /шуруповерт|шуруповёрт|дрел|перфоратор|отвертк|отвёртк|инструмент|гаечн|пассатиж|плоскогубц|рулетк|лобзик|болгарк|паяльник/],
  ["books_stationery", /книг|блокнот|тетрад|ежедневник|ручк[аи] шарик|карандаш|маркер|канцеляр|стикер/],
  ["beauty_health", /витамин|бад\b|омега|коллаген в капсул|пробиотик|магний|таблетк|капсул|тонометр|аптечк/],
  ["cosmetics", /крем|сыворотк|шампун|бальзам для волос|маск[аи] для|тоник|пенк[аи] для умыв|гидрофильн|помад|тушь|тональн|пудр|румян|парфюм|туалетная вода|духи|лак для ногт|скраб|лосьон|мицеллярн|патч|косметик|уход за/],
  ["accessories", /перчатк|варежк|шарф|платок|сумк|кошел|ремень|ремн|очки|бижутер|серьг|кольц|браслет|цепочк|часы\b|зонт|шапк|кепк|панам|бейсболк|рюкзак/],
  ["clothing", /плать|футболк|рубашк|блуз|брюк|джинс|юбк|пальто|куртк|пуховик|свитер|джемпер|кардиган|худи|толстовк|свитшот|жилет|пиджак|костюм|шорт|белье|бельё|носк|колготк|топ\b|лонгслив|комбинезон/],
  ["home", /посуд|кастрюл|сковород|тарелк|кружк|чашк|полотенц|постельн|подушк|одеял|плед|штор|ковер|ковёр|свеч|ваз[аы]|хранени|органайзер|моющ|чистящ|стиральн|средство для|губк|освежител|декор/],
  ["mens", /мужск|для мужчин|бород|бритв|триммер/],
];

/** Best-guess category from a product title, or undefined if nothing matches. */
export function guessCategory(title: string): Category | undefined {
  const t = title.toLowerCase().replace(/ё/g, "е");
  for (const [category, re] of CATEGORY_RULES) {
    if (re.test(t)) return category;
  }
  return undefined;
}
