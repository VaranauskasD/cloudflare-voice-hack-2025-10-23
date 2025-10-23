# 🎙️ Layercode Dual Channel Setup

This setup allows you to run **two instances** of Layercode that connect to the **same agent** for dual-channel voice processing.

## 🏗️ Architecture

```
Machine 1 (Channel A)     Machine 2 (Channel B)
     ↓                           ↓
Layercode Instance A    Layercode Instance B
     ↓                           ↓
     └───────── Same Agent ──────┘
              (xysxke7q)
```

## 🚀 Quick Setup

### Option 1: Same Machine (Different Ports)

```bash
# Run the setup script
./deploy-dual-channel.sh

# Terminal 1 - Channel A
cp .env.channel-a .env.local
npm run dev:channel-a

# Terminal 2 - Channel B  
cp .env.channel-b .env.local
npm run dev:channel-b
```

### Option 2: Different Machines

**Machine 1:**
```bash
git clone your-repo
cd layercode/fullstack-nextjs-cloudflare
cp .env.channel-a .env.local
npm install
npm run dev:channel-a
```

**Machine 2:**
```bash
git clone your-repo
cd layercode/fullstack-nextjs-cloudflare
cp .env.channel-b .env.local
npm install
npm run dev:channel-b
```

## 🔧 How It Works

### 1. Channel Detection
The backend automatically detects which channel is sending audio:
- **Channel A**: `conversation_id` contains `_channel_a` or `_ch_a`
- **Channel B**: `conversation_id` contains `_channel_b` or `_ch_b`
- **Single**: Default behavior for single-channel mode

### 2. Conversation Management
- Each channel maintains its own conversation history
- The AI agent sees the **combined context** from both channels
- Responses are sent back to the appropriate channel

### 3. Dual Channel Processing
```typescript
// Backend automatically handles:
const channelId = detectChannel(conversation_id, requestBody);
const sessionId = extractSessionId(conversation_id);

// Separate storage per channel
const channelA = getChannelConversation(sessionId, 'A');
const channelB = getChannelConversation(sessionId, 'B');

// Combined context for AI
const combinedContext = getCombinedConversation(sessionId);
```

## 🎯 Use Cases

### Phone Calls
- **Channel A**: Caller audio
- **Channel B**: Callee audio
- **Result**: AI can understand both sides of the conversation

### Video Conferences
- **Channel A**: Host audio
- **Channel B**: Participant audio
- **Result**: AI can moderate and respond to both speakers

### Customer Service
- **Channel A**: Customer audio
- **Channel B**: Agent audio
- **Result**: AI can assist both customer and agent

### Language Learning
- **Channel A**: Teacher audio
- **Channel B**: Student audio
- **Result**: AI can provide feedback to both

## 🔧 Configuration

### Environment Variables

**Channel A (.env.channel-a):**
```bash
NEXT_PUBLIC_LAYERCODE_AGENT_ID=xysxke7q
NEXT_PUBLIC_CHANNEL_ID=channel_a
LAYERCODE_API_KEY=your_api_key
LAYERCODE_WEBHOOK_SECRET=your_webhook_secret
OPENAI_API_KEY=your_openai_key
PORT=3000
```

**Channel B (.env.channel-b):**
```bash
NEXT_PUBLIC_LAYERCODE_AGENT_ID=xysxke7q
NEXT_PUBLIC_CHANNEL_ID=channel_b
LAYERCODE_API_KEY=your_api_key
LAYERCODE_WEBHOOK_SECRET=your_webhook_secret
OPENAI_API_KEY=your_openai_key
PORT=3001
```

### Custom Channel Detection

You can customize how channels are detected by modifying the `detectChannel` function:

```typescript
function detectChannel(conversationId: string, requestBody: any): 'A' | 'B' | 'single' {
  // Custom logic here
  if (conversationId.includes('_channel_a')) return 'A';
  if (conversationId.includes('_channel_b')) return 'B';
  if (requestBody.metadata?.channel) {
    return requestBody.metadata.channel === 'A' ? 'A' : 'B';
  }
  return 'single';
}
```

## 📊 Monitoring

The backend logs show:
- Which channel is processing audio
- Individual channel conversation history
- Combined session history
- Turn management across channels

```bash
# Example logs
Processing A channel for session conv_123
Processing B channel for session conv_123
--- final message history for A channel ---
--- final message history for B channel ---
--- combined session history for conv_123 ---
```

## 🚀 Deployment

### Local Development
```bash
npm run dev:channel-a  # Port 3000
npm run dev:channel-b  # Port 3001
```

### Production
```bash
npm run start:channel-a  # Port 3000
npm run start:channel-b  # Port 3001
```

### Cloudflare
```bash
npm run deploy  # Deploy to Cloudflare Workers
```

## 🔍 Testing

1. **Start both instances**
2. **Open two browser tabs**:
   - `http://localhost:3000` (Channel A)
   - `http://localhost:3001` (Channel B)
3. **Connect both to the same agent**
4. **Speak into both microphones**
5. **Check the backend logs** to see dual-channel processing

## 🛠️ Troubleshooting

### Common Issues

**Both channels not connecting:**
- Check API keys in both .env files
- Ensure both instances use the same agent ID
- Verify webhook secrets match

**Audio not processing:**
- Check microphone permissions
- Verify Layercode agent is active
- Check network connectivity

**Conversations not merging:**
- Check conversation_id format
- Verify channel detection logic
- Check backend logs for errors

### Debug Mode

Enable detailed logging by setting:
```bash
DEBUG=layercode:*
```

## 📈 Scaling

To add more channels:
1. Create additional environment files (`.env.channel-c`, etc.)
2. Update the `detectChannel` function
3. Add new channel handling in `getChannelConversation`
4. Deploy additional instances

## 🔐 Security

- Each instance uses the same API keys (secure)
- Webhook signatures are verified for each request
- Conversation data is isolated per session
- No cross-channel data leakage

---

**Ready to test dual-channel voice AI? Run the setup script and start both instances!** 🚀
