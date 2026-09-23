type IconProps = { size?: number };

function Svg({ size = 18, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function InstagramIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function TiktokIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14 3v10.6a3.4 3.4 0 1 1-2.6-3.3M14 3c.4 2.2 2 3.9 4.2 4.2" />
    </Svg>
  );
}

export function TelegramIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </Svg>
  );
}

export function YoutubeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
    </Svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="2" y="4" width="20" height="16" rx="3" />
      <path d="m3 6 9 7 9-7" />
    </Svg>
  );
}

export const SOCIALS = [
  { key: "instagramHandle", label: "Instagram", Icon: InstagramIcon, url: (h: string) => `https://instagram.com/${h}` },
  { key: "tiktokHandle", label: "TikTok", Icon: TiktokIcon, url: (h: string) => `https://tiktok.com/@${h}` },
  { key: "telegramHandle", label: "Telegram", Icon: TelegramIcon, url: (h: string) => `https://t.me/${h}` },
  { key: "youtubeHandle", label: "YouTube", Icon: YoutubeIcon, url: (h: string) => `https://youtube.com/@${h}` },
] as const;

export type SocialKey = (typeof SOCIALS)[number]["key"];
