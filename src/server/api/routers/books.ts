import { clerkClient } from "@clerk/nextjs";
import { type User } from "@clerk/nextjs/dist/types/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";

const filterUserProperties = (user: User) => ({
  id: user.id,
  username: user.username,
  firstname: user.firstName,
  lastname: user.lastName,
  profileImageUrl: user.profileImageUrl,
});

// rate limiter with upstash
import { Ratelimit } from "@upstash/ratelimit"; // for deno: see above
import { Redis } from "@upstash/redis";

// Create a new ratelimiter, that allows 3 requests per minute
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "60 s"),
  analytics: true,
  /**
   * Optional prefix for the keys used in redis. This is useful if you want to share a redis
   * instance with other applications and want to avoid key collisions. The default prefix is
   * "@upstash/ratelimit"
   */ 
  prefix: "@upstash/ratelimit",
});

// Main tRPC router for this entity
export const booksRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const books = await ctx.prisma.book.findMany({ take: 100 });

    const users = (
      await clerkClient.users.getUserList({
        userId: books.map((book) => book.firstOwnerId),
      })
    ).map(filterUserProperties);

    return books.map((book) => {
      const firstOwner = users.find((user) => user.id === book.firstOwnerId);
      if (!firstOwner)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unknown owner for book!",
        });

      return {
        book,
        firstOwner,
      };
    });
  }),

  create: privateProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        author: z.string().min(1).max(200),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const ownerId = ctx.currentUserId;

      // Rate limiter with upstash - using the userId as a key
      const { success } = await ratelimit.limit(ownerId);
      if (!success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message:
            "You have sent too many requests recently! Wait one minute before sending your next request",
        });
      }

      const newBook = await ctx.prisma.book.create({
        data: {
          firstOwnerId: ownerId,
          title: input.title,
          author: input.author,
        },
      });

      return newBook;
    }),
});
