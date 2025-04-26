import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import TwitterProvider from "next-auth/providers/twitter";
import { prisma } from "../../prisma/prismaClient";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Sign in with Google
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // Connect Twitter (optional) for bookmarks
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0",
      authorization: { params: { scope: "tweet.read users.read bookmark.read" } }
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  callbacks: {
    // Persist the provider tokens in the JWT
    async jwt({ token, account }) {
      if (account) {
        if (account.provider === 'google') {
          token.googleId = account.providerAccountId;
          token.googleAccessToken = account.access_token;
        } else if (account.provider === 'twitter') {
          token.twitterId = account.providerAccountId;
          token.twitterAccessToken = account.access_token;
        }
      }
      return token;
    },
    // Make the provider IDs and tokens available in session
    async session({ session, token, user }) {
      session.user.id = user.id;
      session.user.googleId = token.googleId as string;
      session.user.twitterId = token.twitterId as string;
      session.user.twitterAccessToken = token.twitterAccessToken as string;
      return session;
    }
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  events: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && account.providerAccountId) {
        await prisma.user.update({ where: { id: user.id }, data: { googleId: account.providerAccountId } });
      } else if (account?.provider === 'twitter' && account.providerAccountId) {
        await prisma.user.update({ where: { id: user.id }, data: { twitterId: account.providerAccountId } });
      }
    }
  }
};