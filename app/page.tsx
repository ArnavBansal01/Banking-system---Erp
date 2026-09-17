"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { LoginPage } from "@/modules/auth/LoginPage";
import { LandingPage } from "@/modules/landing/LandingPage";
import { useAppStore } from "@/store/useAppStore";
import { Providers } from "./providers";

const title = "Cassmart ERP — Origination, Operations & Collections";
const description =
  "Enterprise workspace for Cassmart Micro Foundations lending: enquiry pipeline, credit decisioning, disbursement operations and collections in one connected case lifecycle.";

export default function Home() {
  return (
    <Providers>
      <IndexInner />
    </Providers>
  );
}

function IndexInner() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const [mounted, setMounted] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Set favicon dynamically (mirrors __root.tsx behavior)
    let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.type = "image/png";
    link.href = "/image.png";

    // Update page title and meta description
    document.title = title;
    const metaDesc = document.querySelector("meta[name='description']");
    if (metaDesc) {
      metaDesc.setAttribute("content", description);
    }
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    if (showLogin) {
      return <LoginPage onBackToHome={() => setShowLogin(false)} />;
    }
    return <LandingPage onLoginClick={() => setShowLogin(true)} />;
  }

  return <AppShell />;
}
