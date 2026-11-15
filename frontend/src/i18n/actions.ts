"use server";

import { cookies } from "next/headers";

import { isLocale, LOCALE_COOKIE } from "./config";

export async function setUserLocale(locale: string) {
  if (!isLocale(locale)) return;
  cookies().set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
}
