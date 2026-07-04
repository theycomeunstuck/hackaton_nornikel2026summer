import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getMe, login as loginWithBackend, logoutMock } from "../api";
import type { AuthState, LoginRequest, User } from "../types";

type AuthContextValue = AuthState & {
  login: (request: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
};

const authStorageTokenKey = "scientific-knot.access-token";
const authStorageUserKey = "scientific-knot.user";

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): User | null {
  const rawUser = window.localStorage.getItem(authStorageUserKey);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as User;
  } catch {
    window.localStorage.removeItem(authStorageUserKey);
    return null;
  }
}

function writeAuthStorage(accessToken: string, user: User) {
  window.localStorage.setItem(authStorageTokenKey, accessToken);
  window.localStorage.setItem(authStorageUserKey, JSON.stringify(user));
}

function clearAuthStorage() {
  window.localStorage.removeItem(authStorageTokenKey);
  window.localStorage.removeItem(authStorageUserKey);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const restoreAuth = async () => {
      const storedToken = window.localStorage.getItem(authStorageTokenKey);
      const storedUser = readStoredUser();

      if (!storedToken || !storedUser) {
        clearAuthStorage();
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      const currentUser = await getMe(storedToken);

      if (!isMounted) {
        return;
      }

      if (currentUser) {
        setAccessToken(storedToken);
        setUser(currentUser);
        writeAuthStorage(storedToken, currentUser);
      } else {
        clearAuthStorage();
      }

      setIsLoading(false);
    };

    void restoreAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (request: LoginRequest) => {
    const response = await loginWithBackend(request.email, request.password);
    setAccessToken(response.accessToken);
    setUser(response.user);
    writeAuthStorage(response.accessToken, response.user);
  }, []);

  const logout = useCallback(async () => {
    await logoutMock();
    setAccessToken(null);
    setUser(null);
    clearAuthStorage();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken,
      user,
      isAuthenticated: Boolean(accessToken && user),
      isLoading,
      login,
      logout,
    }),
    [accessToken, isLoading, login, logout, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
