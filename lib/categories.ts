export const CATEGORIES = ["cosmetics", "mens", "clothing", "tools"] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABEL: Record<Category, string> = {
  cosmetics: "Косметика",
  mens: "Мужские товары",
  clothing: "Одежда",
  tools: "Инструменты",
};

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}
