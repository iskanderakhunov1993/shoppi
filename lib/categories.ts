export const CATEGORIES = [
  "face_care",
  "makeup",
  "hair_care",
  "body_care",
  "perfume",
  "clothing",
  "shoes",
  "bags",
  "accessories",
  "kitchen",
  "home_decor",
  "household",
  "electronics",
  "sport",
  "health",
  "kids",
  "books_stationery",
  "tools",
  "pets",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABEL: Record<Category, string> = {
  face_care: "Уход за лицом",
  makeup: "Декоративная косметика",
  hair_care: "Уход за волосами",
  body_care: "Уход за телом",
  perfume: "Парфюмерия",
  clothing: "Одежда",
  shoes: "Обувь",
  bags: "Сумки и рюкзаки",
  accessories: "Аксессуары и украшения",
  kitchen: "Кухня и посуда",
  home_decor: "Текстиль и декор",
  household: "Бытовая химия и уборка",
  electronics: "Электроника и гаджеты",
  sport: "Спорт и отдых",
  health: "Здоровье и БАДы",
  kids: "Детское",
  books_stationery: "Книги и канцелярия",
  tools: "Инструменты и ремонт",
  pets: "Товары для животных",
};

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}

// Slugs from the original 12-category list, kept so old links, old rows
// and bookmarked /category/<slug> URLs still resolve after the split.
const LEGACY_CATEGORY: Record<string, Category> = {
  cosmetics: "face_care",
  mens: "clothing",
  home: "home_decor",
  beauty_health: "health",
};

/** A current category for any stored value, including pre-split slugs. */
export function normalizeCategory(value: string | null | undefined): Category | undefined {
  if (!value) return undefined;
  if (isCategory(value)) return value;
  return LEGACY_CATEGORY[value];
}

// Word ends use (?![а-яa-z]) — JS's \b only knows ASCII letters, so
// \b after a Cyrillic word never matches.
// Ordered: the first matching rule wins. Narrow or ambiguous cases go
// first — "детские кроссовки" is kids, "средство для мытья посуды" is
// household (not kitchen), "сыворотка для волос" is hair (not face),
// "сыворотка с витамином C" is face care (not a supplement), "фен для
// волос" is electronics (not hair care).
const CATEGORY_RULES: [Category, RegExp][] = [
  ["pets", /для собак|для кошек|для животн|корм для|кошач|собач|лежанк|когтеточк|наполнитель для лотк|ошейник|поводок/],
  ["kids", /детск|для детей|малыш|младен|подгузник|игрушк|коляск|школьн/],
  ["household", /для мытья|моющ|чистящ|стиральн|порошок|гель для стирк|кондиционер для бель|отбеливат|средство для (уборк|чистк|посуд|стекол|пол)|губк|освежител|мешки для мусор/],
  ["sport", /спортивн|фитнес|гантел|коврик для йог|йога|велосипед|самокат|палатк|туристич|рюкзак для поход|мяч(?![а-яa-z])|тренаж|скакалк|бутылк[аи] для вод/],
  ["electronics", /смартфон|телефон|наушник|ноутбук|планшет|зарядн|кабел|колонк|умные часы|смарт-час|фитнес-браслет|пауэрбанк|power ?bank|клавиатур|компьютерн|телевизор|роутер|фен(?![а-яa-z])|стайлер|утюжок|электрическ|зубная щетка/],
  ["tools", /шуруповерт|дрел|перфоратор|отвертк|инструмент|гаечн|пассатиж|плоскогубц|рулетк|лобзик|болгарк|паяльник/],
  ["books_stationery", /книг|блокнот|тетрад|ежедневник|шарикова|карандаш(?![а-яa-z])|маркер|канцеляр|стикер/],
  ["perfume", /парфюм|туалетная вода|духи(?![а-яa-z])|eau de/],
  ["hair_care", /для волос|шампун|бальзам-ополаскиват|сухой шампунь/],
  ["face_care", /сыворотк|гидрофильн|мицеллярн|пенк[аи] для умыв|гель для умыв|тоник|энзимн/],
  ["health", /витамин|бад(?![а-яa-z])|омега|пробиотик|магний|таблетк|капсул|протеин|тонометр|аптечк/],
  ["makeup", /тушь|помад|тональн|консилер|пудр|румян|тени для век|палетк|хайлайтер|бронзер|подводк|карандаш для (глаз|губ|бровей)|блеск для губ|праймер|лак для ногт/],
  ["body_care", /для тела|гель для душа|мыло|дезодорант|антиперспирант|крем для рук|крем для ног|для ванн|бород|бритв|триммер/],
  ["face_care", /крем|маск[аи] для лица|патч|spf|солнцезащит|для лица|пилинг|косметик/],
  ["bags", /сумк|рюкзак|шоппер|клатч|портфел|чемодан|косметичк/],
  ["shoes", /кроссовк|кед[ыа]?(?![а-яa-z])|ботин|сапог|туфл|босонож|сандал|лофер|мокасин|слипон|шлепан|тапочк|сабо(?![а-яa-z])|обувь/],
  ["accessories", /перчатк|варежк|шарф|платок|кошел|ремень|ремн|очки|бижутер|серьг|кольц|браслет|цепочк|часы(?![а-яa-z])|зонт|шапк|кепк|панам|бейсболк/],
  ["clothing", /плать|футболк|рубашк|блуз|брюк|джинс|юбк|пальто|куртк|пуховик|свитер|джемпер|кардиган|худи|толстовк|свитшот|жилет|пиджак|костюм|шорт|белье|носк|колготк|топ(?![а-яa-z])|лонгслив|комбинезон/],
  ["kitchen", /посуд|кастрюл|сковород|тарелк|кружк|чашк|бокал|кофеварк|кофемашин|чайник|турк[аи](?![а-яa-z])|кухон|столов|для выпечк|блендер|миксер|контейнер для еды/],
  ["home_decor", /полотенц|постельн|подушк|одеял|плед|штор|ковер|свеч|ваз[аы](?![а-яa-z])|декор|картин|постер|органайзер|для хранени|рамк[аи] для фото/],
];

/** Best-guess category from a product title, or undefined if nothing matches. */
export function guessCategory(title: string): Category | undefined {
  const t = title.toLowerCase().replace(/ё/g, "е");
  for (const [category, re] of CATEGORY_RULES) {
    if (re.test(t)) return category;
  }
  return undefined;
}
