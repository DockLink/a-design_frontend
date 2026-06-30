import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Large file uploads no longer pass through Next.js — the browser uploads
  // directly to S3 via presigned multipart URLs, so there is no body-size
  // limit to lift here. Only small JSON control messages hit the API routes.
};

export default nextConfig;
