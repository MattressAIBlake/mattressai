import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const THREAD_EXPIRY_HOURS = 24; // Adjust as needed

export async function cleanupOldThreads() {
  try {
    const threads = await openai.beta.threads.list();
    const now = new Date();

    for (const thread of threads.data) {
      const threadCreatedAt = new Date(thread.created_at * 1000);
      const hoursDiff = (now.getTime() - threadCreatedAt.getTime()) / (1000 * 60 * 60);

      if (hoursDiff > THREAD_EXPIRY_HOURS) {
        await openai.beta.threads.del(thread.id);
      }
    }
  } catch (error) {
    console.error('Thread cleanup failed:', error);
  }
}
