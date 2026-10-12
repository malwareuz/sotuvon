
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  secret: process.env.BETTER_AUTH_SECRET!,

  baseURL:
    process.env.BETTER_AUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000",

  trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS
    ? process.env.BETTER_AUTH_TRUSTED_ORIGINS
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
    : process.env.NODE_ENV === "production"
      ? []
      : [
          "http://localhost:3000",
          "http://127.0.0.1:3000",
          "http://192.168.8.186:3000",
        ],

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },

  user: {
    additionalFields: {
      // Foydalanuvchi rolini ommaviy sign-up orqali
      // o'zgartirishga ruxsat berilmaydi.
      role: {
        type: "string",
        defaultValue: "CASHIER",
        input: false,
      },

      // Do'kon identifikatori. Foydalanuvchi uni
      // ommaviy ro'yxatdan o'tishda o'zi belgilay olmaydi.
      storeId: {
        type: "string",
        required: true,
        input: false,
      },
    },
  },

  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7,
    },
  },
});

export type Session = typeof auth.$Infer.Session;
export type AuthUser = typeof auth.$Infer.Session.user;

