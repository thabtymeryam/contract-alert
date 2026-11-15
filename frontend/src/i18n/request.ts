import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "./config";

/** Cookie first, then the browser's Accept-Language, then English. */
function resolveLocale(): Locale {
  const fromCookie = cookies().get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;

  const accept = headers().get("accept-language") ?? "";
  const preferred = accept.split(",")[0]?.trim().slice(0, 2).toLowerCase();
  return isLocale(preferred) ? preferred : defaultLocale;
}

export default getRequestConfig(async () => {
  const locale = resolveLocale();
  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
    timeZone: "Africa/Tunis",
  };
});
