"use client";

import { useCallback, useEffect, useState } from "react";
import { OnboardingModal } from "@/app/dashboard/OnboardingModal";
import { CircleOnboarding } from "@/app/dashboard/CircleOnboarding";
import type { Category } from "@/lib/categories";

/**
 * Same "Настройте Shoppi под себя" checklist as the dashboard's, but
 * self-contained so it can float over the shopping feed (/finds) —
 * where shoppers actually land after login — instead of gating them
 * on the account-management dashboard first.
 */
export function ShopperOnboardingNudge({ initialInterests = [] }: { initialInterests?: Category[] }) {
  const [hasFavorite, setHasFavorite] = useState<boolean | null>(null);
  const [hasFollow, setHasFollow] = useState<boolean | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const loadFavorites = useCallback(async () => {
    const res = await fetch("/api/favorites");
    const data = res.ok ? await res.json() : { favorites: [] };
    setHasFavorite((data.favorites ?? []).length > 0);
  }, []);

  const loadFollows = useCallback(async () => {
    const res = await fetch("/api/follows");
    const data = res.ok ? await res.json() : { creators: [] };
    setHasFollow((data.creators ?? []).length > 0);
  }, []);

  useEffect(() => {
    loadFavorites();
    loadFollows();
  }, [loadFavorites, loadFollows]);

  useEffect(() => {
    if (hasFavorite === null || hasFollow === null) return;
    setShowModal(!(hasFavorite && hasFollow));
  }, [hasFavorite, hasFollow]);

  if (hasFavorite === null || hasFollow === null) return null;

  return (
    <>
      {showModal && (
        <OnboardingModal
          onClose={() => setShowModal(false)}
          steps={[
            {
              n: 1,
              title: "Подпишитесь на блогера",
              description: "Добавьте того, чьему вкусу доверяете, и его рекомендации появятся у вас в ленте.",
              done: hasFollow,
              cta: {
                label: "Быстрый подбор",
                onClick: () => {
                  setShowModal(false);
                  setShowPicker(true);
                },
              },
              secondaryCta: {
                label: "Все блогеры",
                onClick: () => {
                  window.location.href = "/curators";
                },
              },
            },
            {
              n: 2,
              title: "Сохраните товар в избранное",
              description: "На любой витрине блогера нажмите «Сохранить»: товар появится в «Сохранённом».",
              done: hasFavorite,
              cta: {
                label: "Смотреть блогеров",
                onClick: () => {
                  window.location.href = "/curators";
                },
              },
            },
          ]}
        />
      )}

      {showPicker && (
        <CircleOnboarding
          initialInterests={initialInterests}
          onClose={() => setShowPicker(false)}
          onDone={async () => {
            setShowPicker(false);
            await loadFollows();
          }}
        />
      )}
    </>
  );
}
