import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "../../entities/auth/model";

type AppProvidersProps = {
  router: Parameters<typeof RouterProvider>[0]["router"];
};

export function AppProviders({ router }: AppProvidersProps) {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
