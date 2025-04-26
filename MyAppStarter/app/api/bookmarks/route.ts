import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/prisma/prismaClient";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get Twitter account
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: "twitter",
      },
    });

    if (!account) {
      return new NextResponse("Twitter account not linked", { status: 400 });
    }

    // Fetch bookmarks using Twitter API
    const bookmarksResponse = await fetch(
      "https://api.twitter.com/2/users/me/bookmarks?expansions=author_id&tweet.fields=created_at,text,attachments,entities,public_metrics&user.fields=name,username,profile_image_url",
      {
        headers: {
          Authorization: `Bearer ${account.access_token}`,
        },
      }
    );

    if (!bookmarksResponse.ok) {
      return new NextResponse(`Error fetching bookmarks: ${bookmarksResponse.statusText}`, {
        status: bookmarksResponse.status,
      });
    }

    const bookmarksData = await bookmarksResponse.json();
    return NextResponse.json(bookmarksData);
  } catch (error) {
    console.error("Error fetching bookmarks:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 