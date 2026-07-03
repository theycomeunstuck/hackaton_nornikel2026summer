import type { LoginRequest, LoginResponse, User } from "./types";

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
