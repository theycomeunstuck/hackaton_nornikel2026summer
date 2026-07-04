import type { LoginRequest, LoginResponse, User } from "./types";
import { requestJson } from "../../shared/api/appApi";

const testUser: User = {
  id: "researcher-001",
  name: "Инженер-исследователь",
  email: "researcher@demo.local",
  role: "researcher",
  organization: "Научно-технический центр",
};

const testAccessToken = "local-access-token-evidence-hub";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export async function loginMock(request: LoginRequest): Promise<LoginResponse> {
  await delay(420);

  if (request.email === testUser.email && request.password === "demo123") {
    return {
      accessToken: testAccessToken,
      user: testUser,
    };
  }

  throw new Error("Неверная электронная почта или пароль для тестового доступа.");
}

export async function getCurrentUserMock(token: string): Promise<User | null> {
  await delay(220);

  if (token === testAccessToken) {
    return testUser;
  }

  return null;
}

export async function logoutMock(): Promise<void> {
  await delay(120);
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  try {
    return await requestJson<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  } catch {
    return loginMock({ email, password });
  }
}

export async function getMe(token: string): Promise<User | null> {
  try {
    return await requestJson<User>("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    return getCurrentUserMock(token);
  }
}
