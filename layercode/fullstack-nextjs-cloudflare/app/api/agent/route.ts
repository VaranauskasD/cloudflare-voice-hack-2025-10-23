export const dynamic = 'force-dynamic';

import { createOpenAI } from '@ai-sdk/openai';
import { streamText, ModelMessage, tool, stepCountIs } from 'ai';
import z from 'zod';
import { streamResponse, verifySignature } from '@layercode/node-server-sdk';
import { prettyPrintMsgs } from '@/app/utils/msgs';
import config from '@/layercode.config.json';

export type MessageWithTurnId = ModelMessage & { turn_id: string };
type WebhookRequest = {
  conversation_id: string;
  text: string;
  turn_id: string;
  interruption_context?: {
    previous_turn_interrupted: boolean;
    words_heard: number;
    text_heard: string;
    assistant_turn_id?: string;
  };
  type: 'message' | 'session.start' | 'session.update' | 'session.end';
};

const SYSTEM_PROMPT = config.prompt;
const WELCOME_MESSAGE = config.welcome_message;

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// Helper functions for dual channel support
function detectChannel(conversationId: string, requestBody: any): 'A' | 'B' | 'single' {
  // Check if conversation_id contains channel identifier
  if (conversationId.includes('_channel_a') || conversationId.includes('_ch_a')) return 'A';
  if (conversationId.includes('_channel_b') || conversationId.includes('_ch_b')) return 'B';
  
  // Check metadata if available
  if (requestBody.metadata?.channel) {
    return requestBody.metadata.channel === 'A' ? 'A' : 'B';
  }
  
  // Default to single channel
  return 'single';
}

function extractSessionId(conversationId: string): string {
  // Extract base session ID by removing channel suffixes
  return conversationId.replace(/_(channel_[ab]|ch_[ab])$/, '');
}

function getChannelConversation(sessionId: string, channelId: 'A' | 'B'): MessageWithTurnId[] {
  if (!channelConversations[sessionId]) {
    channelConversations[sessionId] = {
      sessionId,
      startTime: Date.now(),
      channelA: [],
      channelB: []
    };
  }
  
  const channelKey = channelId === 'A' ? 'channelA' : 'channelB';
  if (!channelConversations[sessionId][channelKey]) {
    channelConversations[sessionId][channelKey] = [];
  }
  
  return channelConversations[sessionId][channelKey]!;
}

function getCombinedConversation(sessionId: string): MessageWithTurnId[] {
  const session = channelConversations[sessionId];
  if (!session) return [];
  
  const combined: MessageWithTurnId[] = [];
  const channelA = session.channelA || [];
  const channelB = session.channelB || [];
  
  // Merge conversations by timestamp (simplified - in production you'd want more sophisticated merging)
  const allMessages = [...channelA, ...channelB];
  return allMessages.sort((a, b) => (a as any).timestamp - (b as any).timestamp);
}

// In production we recommend fast datastore like Redis or Cloudflare D1 for storing conversation history
// Here we use a simple in-memory object for demo purposes
const conversations = {} as Record<string, MessageWithTurnId[]>;

// Dual channel support - track conversations by channel
const channelConversations = {} as Record<string, {
  channelA?: MessageWithTurnId[];
  channelB?: MessageWithTurnId[];
  sessionId: string;
  startTime: number;
}>;

export const POST = async (request: Request) => {
  const requestBody = (await request.json()) as WebhookRequest;
  console.log('Webhook received from Layercode', requestBody);

  // Verify this webhook request is from Layercode
  const signature = request.headers.get('layercode-signature') || '';
  const secret = process.env.LAYERCODE_WEBHOOK_SECRET || '';
  const isValid = verifySignature({
    payload: JSON.stringify(requestBody),
    signature,
    secret
  });
  if (!isValid) return new Response('Invalid layercode-signature', { status: 401 });

  const { conversation_id, text: userText, turn_id, type, interruption_context } = requestBody;
  
  // Detect channel from conversation_id or metadata
  const channelId = detectChannel(conversation_id, requestBody);
  const sessionId = extractSessionId(conversation_id);

  // Handle dual channel or single channel conversations
  let currentConversation: MessageWithTurnId[];
  
  if (channelId === 'single') {
    // Single channel mode (original behavior)
    if (!conversations[conversation_id]) {
      conversations[conversation_id] = [];
    }
    currentConversation = conversations[conversation_id];
  } else {
    // Dual channel mode
    currentConversation = getChannelConversation(sessionId, channelId);
    console.log(`Processing ${channelId} channel for session ${sessionId}`);
  }

  // Immediately store the user message received
  const userMessage = { role: 'user' as const, turn_id, content: userText, timestamp: Date.now() };
  currentConversation.push(userMessage);

  switch (type) {
    case 'session.start':
      // A new session/call has started. If you want to send a welcome message (have the agent speak first), return that here.
      return streamResponse(requestBody, async ({ stream }) => {
        // Save the welcome message to the conversation history
        conversations[conversation_id].push({ role: 'assistant', turn_id, content: WELCOME_MESSAGE });
        // Send the welcome message to be spoken
        stream.tts(WELCOME_MESSAGE);
        stream.end();
      });
    case 'message':
      // The user has spoken and the transcript has been received. Call our LLM and genereate a response.

      // Before generating a response, we store a placeholder assistant msg in the history. This is so that if the agent response is interrupted (which is common for voice agents), before we have the chance to save our agent's response, our conversation history will still follow the correct user-assistant turn order.
      const assistantResposneIdx = conversations[conversation_id].push({ role: 'assistant', turn_id, content: '' });
      return streamResponse(requestBody, async ({ stream }) => {
        const weather = tool({
          description: 'Get the weather in a location',
          inputSchema: z.object({
            location: z.string().describe('The location to get the weather for')
          }),
          execute: async ({ location }) => {
            stream.data({ isThinking: true });
            // do something to get the weather
            stream.data({ isThinking: false });

            return {
              location,
              temperature: 72 + Math.floor(Math.random() * 21) - 10
            };
          }
        });
        // For dual channel, use combined conversation context
        const messagesForLLM = channelId === 'single' 
          ? currentConversation 
          : getCombinedConversation(sessionId);
        
        const { textStream } = streamText({
          model: openai('gpt-4o-mini'),
          system: SYSTEM_PROMPT,
          messages: messagesForLLM, // The user message has already been added to the conversation array earlier, so the LLM will be responding to that.
          tools: { weather },
          toolChoice: 'auto',
          stopWhen: stepCountIs(10),
          onFinish: async ({ response }) => {
            // The assistant has finished generating the full response text. Now we update our conversation history with the additional messages generated. For a simple LLM generated single agent response, there will be one additional message. If you add some tools, and allow multi-step agent mode, there could be multiple additional messages which all need to be added to the conversation history.

            // First, we remove the placeholder assistant message we added earlier, as we will be replacing it with the actual generated messages.
            currentConversation.splice(assistantResposneIdx - 1, 1);

            // Push the new messages returned from the LLM into the conversation history, adding the Layercode turn_id to each message.
            const assistantMessages = response.messages.map((m) => ({ ...m, turn_id, timestamp: Date.now() }));
            currentConversation.push(...assistantMessages);

            console.log(`--- final message history for ${channelId} channel ---`);
            prettyPrintMsgs(currentConversation);
            
            if (channelId !== 'single') {
              console.log(`--- combined session history for ${sessionId} ---`);
              prettyPrintMsgs(getCombinedConversation(sessionId));
            }

            stream.end(); // Tell Layercode we are done responding
          }
        });

        // Stream the text response as it is generated, and have it spoken in real-time
        await stream.ttsTextStream(textStream);
      });
    case 'session.end':
      // The session/call has ended. Here you could store or analyze the conversation transcript (stored in your conversations history)
      return new Response('OK', { status: 200 });
    case 'session.update':
      // The session/call state has been updated. This happens after the session has ended, and when the recording audio file has been processed and is available for download.
      return new Response('OK', { status: 200 });
  }
};
