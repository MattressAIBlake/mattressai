import { getServerSession } from "next-auth/next";
import { authOptions, ExtendedSession } from "@/app/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/prisma/prismaClient";

export async function GET() {
  try {
    const session = await getServerSession(authOptions) as ExtendedSession | null;
    
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const ideas = await prisma.idea.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(ideas);
  } catch (error) {
    console.error("Error fetching ideas:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 