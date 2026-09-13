import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { LoginPage } from "@/modules/auth/LoginPage";
import { useAppStore } from "@/store/useAppStore";

const title = "NBFC Loan ERP — Origination, Operations & Collections";
const description =
  "Enterprise workspace for NBFC lending: enquiry pipeline, credit decisioning, disbursement operations and collections in one connected case lifecycle.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Index,
});

function Index() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <AppShell />;
}
