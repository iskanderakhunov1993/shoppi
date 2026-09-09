"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreatorDashboard } from "./CreatorDashboard";
import { ShopperDashboard } from "./ShopperDashboard";
import { BrandDashboard } from "./BrandDashboard";

type Me = {
  role: "shopper" | "creator" | "brand";
  displayName: string;
  slug?: string;
  bio?: string;
  brandDomain?: string;
  brandArticles?: string[];
};

export default function DashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);

  const loadMe = useCallback(async () => {
    const res = await fetch("/api/me");
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    setMe(await res.json());
  }, [router]);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  if (!me) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-stone text-sm">Загрузка…</p>
      </main>
    );
  }

  if (me.role === "creator") return <CreatorDashboard me={me} onProfileSaved={loadMe} />;
  if (me.role === "brand") return <BrandDashboard me={me} onProfileSaved={loadMe} />;
  return <ShopperDashboard me={me} />;
}
