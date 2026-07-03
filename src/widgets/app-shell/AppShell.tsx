import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

const sidebarStorageKey = "rdEvidenceHub.sidebarCollapsed";

function getInitialSidebarState(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(sidebarStorageKey) === "true";
}

export function AppShell() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(getInitialSidebarState);

  useEffect(() => {
    window.localStorage.setItem(sidebarStorageKey, String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-transparent text-slate-900">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapsed={() => setIsSidebarCollapsed((current) => !current)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 px-8 pb-8 pt-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
