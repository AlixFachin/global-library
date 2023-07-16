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
