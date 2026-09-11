import { useAppStore } from "@/store/useAppStore";
import { TopNav } from "@/components/layout/TopNav";
import { CaseDrawer } from "@/components/drawer/CaseDrawer";
import { EmmsModule } from "@/modules/emms/EmmsModule";
import { CreditModule } from "@/modules/credit/CreditModule";
import { OperationsModule } from "@/modules/operations/OperationsModule";
import { CollectionsModule } from "@/modules/collections/CollectionsModule";
import { ManagementModule } from "@/modules/management/ManagementModule";

export function AppShell() {
  const view = useAppStore((s) => s.currentView);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav />
      <main className="mx-auto w-full max-w-[1600px] px-4 py-5 lg:px-6">
        {view === "EMMS" && <EmmsModule />}
        {view === "Credit" && <CreditModule />}
        {view === "AMS" && <OperationsModule />}
        {view === "Collections" && <CollectionsModule />}
        {view === "Management" && <ManagementModule />}
      </main>
      <CaseDrawer />
    </div>
  );
}
