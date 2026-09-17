import { useAppStore } from "@/store/useAppStore";
import { TopNav } from "@/components/layout/TopNav";
import { CaseDrawer } from "@/components/drawer/CaseDrawer";
import { EmmsModule } from "@/modules/emms/EmmsModule";
import { CreditModule } from "@/modules/credit/CreditModule";
import { OperationsModule } from "@/modules/operations/OperationsModule";
import { CollectionsModule } from "@/modules/collections/CollectionsModule";
import { ManagementModule } from "@/modules/management/ManagementModule";
import { PoweredByGlamarode } from "@/components/layout/PoweredByGlamarode";

export function AppShell() {
  const view = useAppStore((s) => s.currentView);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <div>
        <TopNav />
        <main className="mx-auto w-full max-w-[1600px] px-4 py-5 lg:px-6">
          {view === "EMMS" && <EmmsModule />}
          {view === "Credit" && <CreditModule />}
          {view === "AMS" && <OperationsModule />}
          {view === "Collections" && <CollectionsModule />}
          {view === "Management" && <ManagementModule />}
        </main>
      </div>
      <footer className="w-full border-t border-border/50 bg-background/50 backdrop-blur-sm py-2 px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted-foreground mt-auto">
        <div className="flex items-center gap-2">
          <img src="/image.png" alt="Cassmart Logo" className="size-4 object-contain rounded-xs" />
          <span>Cassmart Micro Foundations • Core Banking & Lending ERP</span>
        </div>
      </footer>
      <PoweredByGlamarode variant="floating-oval" />
      <CaseDrawer />
    </div>
  );
}
