import type { LoginRequest, LoginResponse, User } from "./types";

const demoUser: User = {
  id: "demo-researcher-001",
  name: "Демо Исследователь",
  email: "researcher@demo.local",
  role: "researcher",
  organization: "Научно-технический центр",
};

const demoAccessToken = "mock-access-token-scientific-knot";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export async function loginMock(request: LoginRequest): Promise<LoginResponse> {
  await delay(420);

  if (request.email === demoUser.email && request.password === "demo123") {
    return {
      accessToken: demoAccessToken,
      user: demoUser,
    };
  }

  throw new Error("Неверный email или пароль для demo-доступа.");
}

export async function getCurrentUserMock(token: string): Promise<User | null> {
  await delay(220);

  if (token === demoAccessToken) {
    return demoUser;
  }

  return null;
}

export async function logoutMock(): Promise<void> {
  await delay(120);
}
