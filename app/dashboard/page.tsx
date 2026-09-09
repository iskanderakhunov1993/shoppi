"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreatorDashboard } from "./CreatorDashboard";
import { ShopperDashboard } from "./ShopperDashboard";
import { BrandDashboard } from "./BrandDashboard";

type Me = {
  role: "shopper" | "creator" | "brand";
  displayName: string;
  slug?: string;
  brandDomain?: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    fetch("/api/me").then((res) => {
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      res.json().then(setMe);
    });
  }, [router]);

  if (!me) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-stone text-sm">Загрузка…</p>
      </main>
    );
  }

  if (me.role === "creator") return <CreatorDashboard me={me} />;
  if (me.role === "brand") return <BrandDashboard me={me} />;
  return <ShopperDashboard me={me} />;
}
