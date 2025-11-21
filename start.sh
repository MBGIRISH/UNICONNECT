#!/bin/bash
# UniConnect Launcher Script

echo "🚀 Starting UniConnect..."
echo ""

# Kill any existing Vite processes
pkill -f vite 2>/dev/null

# Start the dev server
cd "$(dirname "$0")"
npm run dev &

# Wait for server to start
sleep 3

# Open browser
echo "✅ Server started!"
echo "🌐 Opening browser at http://localhost:3000"
echo ""
open http://localhost:3000

echo "📱 If browser doesn't open automatically, visit:"
echo "   👉 http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Keep script running
wait

