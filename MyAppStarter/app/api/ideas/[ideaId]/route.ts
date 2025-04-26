import { getServerSession } from "next-auth/next";
import { authOptions, ExtendedSession } from "@/app/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/prisma/prismaClient";

export async function GET(
  request: Request,
  { params }: { params: { ideaId: string } }
) {
  try {
    const session = await getServerSession(authOptions) as ExtendedSession | null;
    
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const idea = await prisma.idea.findUnique({
      where: {
        id: params.ideaId,
      },
    });

    if (!idea) {
      return new NextResponse("Idea not found", { status: 404 });
    }

    // Verify idea belongs to the user
    if (idea.userId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    return NextResponse.json(idea);
  } catch (error) {
    console.error("Error fetching idea:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 