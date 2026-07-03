import { AppProviders } from "./providers/AppProviders";
import { router } from "./router";

export function App() {
  return <AppProviders router={router} />;
}
