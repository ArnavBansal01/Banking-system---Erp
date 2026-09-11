import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";

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
  return <AppShell />;
}
