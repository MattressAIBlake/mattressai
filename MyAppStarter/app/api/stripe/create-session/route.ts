import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-08-16' });

export async function POST(req: Request) {
  const { ideaId } = await req.json();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'App Blueprint',
            description: 'Full access to your app blueprint'
          },
          unit_amount: 1000 // $10.00
        },
        quantity: 1
      }
    ],
    mode: 'payment',
    success_url: `${process.env.NEXTAUTH_URL}/dashboard/${ideaId}`,
    cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/${ideaId}`,
    metadata: {
      ideaId
    }
  });

  return NextResponse.json({ url: session.url });
} 