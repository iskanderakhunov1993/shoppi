"use client";

import { inputClass } from "@/app/components/Field";

/**
 * "Реклама" marking for a product: a checkbox and, once ticked, the
 * advertiser / erid text that is shown publicly next to the label.
 */
export function AdFields({
  isAd,
  adInfo,
  onChange,
  boxed = true,
}: {
  isAd: boolean;
  adInfo: string;
  onChange: (next: { isAd: boolean; adInfo: string }) => void;
  boxed?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-start gap-2.5 text-[13px] leading-snug cursor-pointer">
        <input
          type="checkbox"
          checked={isAd}
          onChange={(e) => onChange({ isAd: e.target.checked, adInfo })}
          className="mt-0.5 shrink-0"
        />
        Рекламная ссылка (партнёрская или по договору с брендом)
      </label>
      {isAd && (
        <>
          <input
            value={adInfo}
            onChange={(e) => onChange({ isAd, adInfo: e.target.value })}
            placeholder="Рекламодатель и erid, например: ООО «Бренд», erid: 2VtzqXXXX"
            maxLength={200}
            aria-label="Рекламодатель и erid"
            className={`${inputClass} ${boxed ? "border border-line px-3 py-2" : ""}`}
          />
          <p className="text-stone text-[11.5px] leading-relaxed">
            Товар будет публично помечен «Реклама» с этим текстом. Токен erid выдаёт оператор
            рекламных данных — укажите его как получили.
          </p>
        </>
      )}
    </div>
  );
}
