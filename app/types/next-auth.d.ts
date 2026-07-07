import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      name?: string | null;
      email?: string | null;
    };
  }

  interface User {
    id: string;
    role: string;
    name?: string | null;
    email?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id:            string;
    role:          string;
    name?:         string | null;
    email?:        string | null;
    token_version?: number;
    is_active?:    boolean;
    invalid?:      boolean;
  }
}
