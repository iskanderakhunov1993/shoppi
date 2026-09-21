/**
 * "Реклама" marking for a product the creator flagged as a paid or partner
 * placement. `adInfo` is the advertiser / erid text the creator entered;
 * it is shown next to the label exactly as written.
 */
export function AdLabel({ isAd, adInfo }: { isAd?: boolean; adInfo?: string }) {
  if (!isAd) return null;
  return (
    <span className="block text-[10.5px] leading-snug text-stone">
      <span className="uppercase tracking-wide border border-line px-1 py-px mr-1.5">Реклама</span>
      {adInfo}
    </span>
  );
}
