/**
 * middleware file for Auth
 * See https://clerk.com/docs/nextjs/get-started-with-nextjs
 */
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: ["/"],
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
