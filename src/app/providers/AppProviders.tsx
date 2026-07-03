import { RouterProvider } from "react-router-dom";

type AppProvidersProps = {
  router: Parameters<typeof RouterProvider>[0]["router"];
};

export function AppProviders({ router }: AppProvidersProps) {
  return <RouterProvider router={router} />;
}
