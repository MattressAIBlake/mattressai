import { NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
import { prisma } from "@/prisma/prismaClient";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-08-16",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Extract ideaId from metadata
    const ideaId = session.metadata?.ideaId;
    
    if (!ideaId) {
      return new NextResponse("Missing ideaId in metadata", { status: 400 });
    }
    
    try {
      // Update idea status to paid
      await prisma.idea.update({
        where: { id: ideaId },
        data: { paid: true },
      });
      
      return new NextResponse(JSON.stringify({ received: true }), {
        status: 200,
      });
    } catch (error) {
      console.error("Error updating idea:", error);
      return new NextResponse("Error updating idea", { status: 500 });
    }
  }

  return new NextResponse(JSON.stringify({ received: true }), {
    status: 200,
  });
} 