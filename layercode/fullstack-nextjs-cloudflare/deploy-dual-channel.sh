#!/bin/bash

# Layercode Dual Channel Deployment Script
# This script helps you deploy two instances of Layercode for dual-channel processing

echo "🎙️ Layercode Dual Channel Setup"
echo "================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the layercode project directory"
    exit 1
fi

# Create environment files for each channel
echo "📝 Creating environment files..."

# Channel A environment
cat > .env.channel-a << EOF
# Layercode Configuration - Channel A
NEXT_PUBLIC_LAYERCODE_AGENT_ID=xysxke7q
NEXT_PUBLIC_CHANNEL_ID=channel_a
LAYERCODE_API_KEY=your_layercode_api_key_here
LAYERCODE_WEBHOOK_SECRET=your_webhook_secret_here
LAYERCODE_API_URL=https://api.layercode.com

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Server Configuration
PORT=3000
EOF

# Channel B environment
cat > .env.channel-b << EOF
# Layercode Configuration - Channel B
NEXT_PUBLIC_LAYERCODE_AGENT_ID=xysxke7q
NEXT_PUBLIC_CHANNEL_ID=channel_b
LAYERCODE_API_KEY=your_layercode_api_key_here
LAYERCODE_WEBHOOK_SECRET=your_webhook_secret_here
LAYERCODE_API_URL=https://api.layercode.com

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Server Configuration
PORT=3001
EOF

echo "✅ Environment files created:"
echo "   - .env.channel-a (for Channel A on port 3000)"
echo "   - .env.channel-b (for Channel B on port 3001)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🚀 Setup Complete!"
echo ""
echo "To run dual channel instances:"
echo ""
echo "Terminal 1 (Channel A):"
echo "  cp .env.channel-a .env.local"
echo "  npm run dev:channel-a"
echo ""
echo "Terminal 2 (Channel B):"
echo "  cp .env.channel-b .env.local"
echo "  npm run dev:channel-b"
echo ""
echo "Or on different machines:"
echo "  Machine 1: Copy this project, use .env.channel-a, run on port 3000"
echo "  Machine 2: Copy this project, use .env.channel-b, run on port 3001"
echo ""
echo "🌐 Access URLs:"
echo "  Channel A: http://localhost:3000"
echo "  Channel B: http://localhost:3001"
echo ""
echo "📋 Next Steps:"
echo "1. Update the API keys in the .env files"
echo "2. Run both instances"
echo "3. Connect to the same Layercode agent from both channels"
echo "4. The backend will automatically handle dual-channel processing"
