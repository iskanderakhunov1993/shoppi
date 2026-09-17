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
