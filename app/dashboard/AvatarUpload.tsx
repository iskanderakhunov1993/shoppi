"use client";

import { useRef, useState } from "react";
import { placeholderAvatar } from "@/lib/avatar";

const SIZE = 384;

/** Center-crops to a square and shrinks it, so a 12 MB phone photo
 * becomes a ~30 KB upload. */
async function toSquareJpeg(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, SIZE, SIZE);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.85);
}

export function AvatarUpload({
  avatarUrl,
  seed,
  onChange,
  size = 96,
}: {
  avatarUrl?: string;
  seed: string;
  onChange: (url: string) => void;
  size?: number;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Выберите изображение");
      return;
    }
    setBusy(true);
    try {
      const image = await toSquareJpeg(file);
      const res = await fetch("/api/me/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Не удалось загрузить фото");
      } else {
        onChange(data.avatarUrl);
      }
    } catch {
      setError("Не удалось обработать фото");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        aria-label="Загрузить фото профиля"
        className="relative rounded-full overflow-hidden border border-line cursor-pointer group disabled:cursor-wait"
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatarUrl || placeholderAvatar(seed)} alt="" className="w-full h-full object-cover bg-raise" />
        <span className="absolute inset-0 flex items-center justify-center bg-ink/55 text-paper text-[11px] uppercase tracking-wide opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
          {busy ? "…" : "Изменить"}
        </span>
      </button>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        className="text-[11px] uppercase tracking-wider text-stone hover:text-ink transition-colors cursor-pointer"
      >
        {busy ? "Загружаем…" : avatarUrl ? "Изменить фото" : "Добавить фото"}
      </button>
      {error && <p className="text-error text-[12px]">{error}</p>}
    </div>
  );
}
