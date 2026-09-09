import Link from "next/link";

export function RoleHero({
  eyebrow,
  titlePrefix,
  titleEmphasis,
  titleSuffix,
  subhead,
  ctaLabel,
  ctaHref,
  imageSeed,
}: {
  eyebrow: string;
  titlePrefix: string;
  titleEmphasis: string;
  titleSuffix: string;
  subhead: string;
  ctaLabel: string;
  ctaHref: string;
  imageSeed: string;
}) {
  return (
    <section className="relative h-[520px] md:h-[600px] overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://picsum.photos/seed/${imageSeed}/1600/1000`}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Fixed dark scrim, not the theme-relative ink/paper tokens —
          this overlay must stay dark regardless of site theme. */}
      <div className="absolute inset-0 bg-linear-to-t from-black via-black/65 to-black/25" />
      <div className="relative h-full flex flex-col justify-end px-6 md:px-10 pb-14 md:pb-20 max-w-2xl">
        <span className="text-[11px] uppercase tracking-widest text-white/70 mb-4">
          {eyebrow}
        </span>
        <h1 className="font-display text-white text-4xl md:text-6xl leading-[1.1] mb-6">
          {titlePrefix} <em className="italic">{titleEmphasis}</em> {titleSuffix}
        </h1>
        <p className="text-white/80 text-[15px] md:text-base max-w-md mb-8">
          {subhead}
        </p>
        <Link
          href={ctaHref}
          className="w-fit text-[13px] font-semibold uppercase tracking-wide text-black bg-white px-6 py-3.5 hover:opacity-85 transition-opacity"
        >
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}
