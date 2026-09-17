"use client";

import { useCallback, useEffect, useState } from "react";

type LinkRow = { id: string; title: string };
type Section = { id: string; name: string; icon?: string; position: number; hidden: boolean; linkIds: string[] };

/**
 * Lets a creator group their own products into named sections shown
 * as extra filter chips on the storefront — separate from the fixed
 * platform category. Modeled on ShopMy's "Your Shop Sections", minus
 * the auto-imported "Instagram" section (we have no social scraping
 * to back that with).
 */
export function SectionsManager({ links }: { links: LinkRow[] }) {
  const [sections, setSections] = useState<Section[] | null>(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [iconEditingId, setIconEditingId] = useState<string | null>(null);
  const [iconValue, setIconValue] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/sections");
    setSections(res.ok ? (await res.json()).sections : []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createSection(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    const res = await fetch("/api/sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    setCreating(false);
    if (res.ok) {
      setNewName("");
      await load();
    }
  }

  async function move(id: string, direction: "up" | "down") {
    await fetch(`/api/sections/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ move: direction }),
    });
    await load();
  }

  async function toggleHidden(section: Section) {
    await fetch(`/api/sections/${section.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hidden: !section.hidden }),
    });
    await load();
  }

  async function rename(id: string) {
    if (!renameValue.trim()) {
      setRenamingId(null);
      return;
    }
    await fetch(`/api/sections/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: renameValue.trim() }),
    });
    setRenamingId(null);
    await load();
  }

  async function saveIcon(id: string) {
    await fetch(`/api/sections/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ icon: iconValue.trim().slice(0, 4) }),
    });
    setIconEditingId(null);
    await load();
  }

  async function remove(id: string) {
    const confirmed = window.confirm("Удалить раздел? Товары останутся, изменится только группировка.");
    if (!confirmed) return;
    await fetch(`/api/sections/${id}`, { method: "DELETE" });
    if (openId === id) setOpenId(null);
    await load();
  }

  async function toggleLink(sectionId: string, linkId: string, included: boolean) {
    await fetch(`/api/sections/${sectionId}/links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ linkId, included }),
    });
    await load();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-[11px] uppercase tracking-wider text-stone mb-1">Разделы витрины</h3>
        <p className="text-stone text-[13px] leading-relaxed">
          Соберите свои товары в именованные разделы — например, «Подарки» или «На дачу». Они
          появятся дополнительными вкладками на витрине, рядом с «Последние» и «Популярное».
          Один товар может быть в нескольких разделах сразу.
        </p>
      </div>

      {sections === null ? (
        <p className="text-stone text-sm">Загрузка…</p>
      ) : (
        <div className="flex flex-col gap-2">
          {sections.length === 0 && (
            <p className="font-display italic text-stone text-sm">Пока нет ни одного раздела.</p>
          )}
          {sections.map((section, i) => (
            <div key={section.id} className="border border-line">
              <div className="flex items-center gap-2 px-4 py-3">
                <div className="flex flex-col -my-1">
                  <button
                    type="button"
                    onClick={() => move(section.id, "up")}
                    disabled={i === 0}
                    aria-label="Переместить выше"
                    className="text-stone hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-[10px] leading-none"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => move(section.id, "down")}
                    disabled={i === sections.length - 1}
                    aria-label="Переместить ниже"
                    className="text-stone hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-[10px] leading-none"
                  >
                    ▼
                  </button>
                </div>

                {iconEditingId === section.id ? (
                  <input
                    autoFocus
                    value={iconValue}
                    onChange={(e) => setIconValue(e.target.value)}
                    onBlur={() => saveIcon(section.id)}
                    onKeyDown={(e) => e.key === "Enter" && saveIcon(section.id)}
                    placeholder="🎁"
                    className="w-8 text-center text-[15px] bg-transparent border-b border-ink outline-none py-1"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIconEditingId(section.id);
                      setIconValue(section.icon ?? "");
                    }}
                    aria-label="Иконка раздела"
                    title="Добавить эмодзи"
                    className="w-8 h-8 flex-none flex items-center justify-center text-[15px] text-stone hover:text-ink border border-line rounded-full cursor-pointer"
                  >
                    {section.icon || "+"}
                  </button>
                )}

                {renamingId === section.id ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => rename(section.id)}
                    onKeyDown={(e) => e.key === "Enter" && rename(section.id)}
                    className="flex-1 text-[13px] bg-transparent border-b border-ink outline-none py-1"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setOpenId((v) => (v === section.id ? null : section.id))}
                    className={`flex-1 text-left text-[13px] font-medium cursor-pointer ${section.hidden ? "text-stone" : "text-ink"}`}
                  >
                    {section.name}
                    <span className="text-stone font-normal"> · {section.linkIds.length}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => toggleHidden(section)}
                  aria-label={section.hidden ? "Показать раздел" : "Скрыть раздел"}
                  title={section.hidden ? "Скрыт — показать" : "Скрыть с витрины"}
                  className="text-stone hover:text-ink transition-colors cursor-pointer text-[11px] uppercase tracking-wide"
                >
                  {section.hidden ? "Скрыт" : "Виден"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRenamingId(section.id);
                    setRenameValue(section.name);
                  }}
                  aria-label="Переименовать"
                  className="text-stone hover:text-ink transition-colors cursor-pointer text-[11px] uppercase tracking-wide"
                >
                  Изменить
                </button>
                <button
                  type="button"
                  onClick={() => remove(section.id)}
                  aria-label="Удалить раздел"
                  className="text-stone hover:text-error transition-colors cursor-pointer text-[11px] uppercase tracking-wide"
                >
                  Удалить
                </button>
              </div>

              {openId === section.id && (
                <div className="border-t border-line px-4 py-3 flex flex-col gap-2 max-h-64 overflow-y-auto">
                  {links.length === 0 ? (
                    <p className="text-stone text-[12.5px]">Сначала добавьте товары во вкладке «Товары».</p>
                  ) : (
                    links.map((link) => (
                      <label key={link.id} className="flex items-center gap-2.5 text-[13px] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={section.linkIds.includes(link.id)}
                          onChange={(e) => toggleLink(section.id, link.id, e.target.checked)}
                        />
                        {link.title}
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <form onSubmit={createSection} className="flex gap-2">
        <input
          placeholder="Название раздела, например «Подарки»"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1 text-[13px] px-3 py-2.5 border border-line bg-transparent outline-none focus:border-ink transition-colors"
        />
        <button
          type="submit"
          disabled={creating || !newName.trim()}
          className="text-[12px] font-semibold uppercase tracking-wide text-paper bg-ink px-4 py-2.5 hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {creating ? "…" : "Добавить"}
        </button>
      </form>
    </div>
  );
}
