import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute, PublicOnlyRoute } from "../entities/auth/model";
import { AppShell } from "../widgets/app-shell/AppShell";
import { AuthPage } from "../pages/AuthPage/AuthPage";
import { ClaimsPage } from "../pages/ClaimsPage/ClaimsPage";
import { ContradictionsPage } from "../pages/ContradictionsPage/ContradictionsPage";
import { DashboardPage } from "../pages/DashboardPage/DashboardPage";
import { ExportPage } from "../pages/ExportPage/ExportPage";
import { GraphPage } from "../pages/GraphPage/GraphPage";
import { SearchPage } from "../pages/SearchPage/SearchPage";
import { SourcesPage } from "../pages/SourcesPage/SourcesPage";
import { UploadPage } from "../pages/UploadPage/UploadPage";

export const router = createBrowserRouter([
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: "auth", element: <AuthPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: "dashboard", element: <DashboardPage /> },
          { path: "search", element: <SearchPage /> },
          { path: "claims", element: <ClaimsPage /> },
          { path: "graph", element: <GraphPage /> },
          { path: "sources", element: <SourcesPage /> },
          { path: "contradictions", element: <ContradictionsPage /> },
          { path: "export", element: <ExportPage /> },
          { path: "upload", element: <UploadPage /> },
          { path: "*", element: <Navigate to="/dashboard" replace /> },
        ],
      },
    ],
  },
]);
