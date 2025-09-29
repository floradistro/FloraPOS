#!/bin/bash

# Flora POS - Port 3000 Enforcement Script
# This script ensures ONLY port 3000 is used for development

echo "🔒 Enforcing single port policy - ONLY port 3000 allowed"

# Kill any processes running on other common development ports
PORTS_TO_KILL="3001 3002 3003 3004 3005 8080 8000 5000 4000 9000 8888 4200 5173 5174"

for port in $PORTS_TO_KILL; do
    PID=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$PID" ]; then
        echo "❌ Killing process on port $port (PID: $PID)"
        kill -9 $PID 2>/dev/null
    fi
done

# Check if port 3000 is available
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "⚠️  Port 3000 is already in use. Checking if it's our app..."
    PID=$(lsof -ti:3000)
    PROCESS=$(ps -p $PID -o comm= 2>/dev/null)
    if [[ "$PROCESS" == *"node"* ]] || [[ "$PROCESS" == *"next"* ]]; then
        echo "✅ Port 3000 is being used by a Node.js/Next.js process - this is allowed"
    else
        echo "❌ Port 3000 is being used by: $PROCESS (PID: $PID)"
        echo "🔒 Killing non-Node process on port 3000"
        kill -9 $PID 2>/dev/null
    fi
else
    echo "✅ Port 3000 is available"
fi

echo "🎯 Port enforcement complete - Only port 3000 is allowed for Flora POS"
