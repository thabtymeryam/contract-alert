const createNextIntlPlugin = require("next-intl/plugin");

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // FastAPI routes end in "/" (e.g. /users/). Keep the slash so the /api proxy
  // forwards the exact path instead of bouncing through two redirects.
  skipTrailingSlashRedirect: true,
};

module.exports = withNextIntl(nextConfig);
