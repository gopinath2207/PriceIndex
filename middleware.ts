import { type NextRequest } from "next/server";
import { createClient as createSupabaseMiddlewareResponse } from "./src/utils/supabase/middleware";

export function middleware(request: NextRequest) {
  return createSupabaseMiddlewareResponse(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
