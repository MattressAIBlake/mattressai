import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { OpenAI } from 'openai';
import { prisma } from '@/prisma/prismaClient';
import { ExtendedSession } from '@/app/lib/auth';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions) as ExtendedSession | null;
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  const { environment } = await req.json();
  // fetch bookmarks
  const bmRes = await fetch(`${process.env.NEXTAUTH_URL}/api/bookmarks`);
  const bookmarks = await bmRes.json();

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const chat = await openai.chat.completions.create({
    model: 'gpt-4o-resp',
    messages: [
      { role: 'system', content: 'You are a generator that...' },
      {
        role: 'user',
        content: `Analyze these tweets:\n${JSON.stringify(
          bookmarks
        )}\nOutput JSON with summary, rules, prompts.`
      }
    ]
  });

  if (!chat.choices[0].message.content) {
    return new Response('Failed to generate response', { status: 500 });
  }

  const { summary, rules, prompts } = JSON.parse(chat.choices[0].message.content);
  const idea = await prisma.idea.create({
    data: {
      userId: session.user.id,
      summary: summary,
      rules: rules,
      prompts,
      environment,
      paid: false
    }
  });

  // return first 50% preview
  const preview = (s: string) => s.slice(0, s.length / 2);
  return new Response(
    JSON.stringify({
      ideaId: idea.id,
      summary: preview(summary),
      rules: preview(rules),
      prompts: preview(prompts)
    }),
    { status: 201 }
  );
} 