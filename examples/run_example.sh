#!/bin/bash

# run_example.sh
# 运行示例脚本

echo "========================================="
echo "  Embedded AI Agent - Running Example  "
echo "========================================="
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null
then
    echo "Error: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# 检查依赖
if [ ! -d "../node_modules" ]; then
    echo "Installing dependencies..."
    cd ..
    npm install
    cd examples
fi

# 检查 API Key
if [ -z "$QWEN_API_KEY" ]; then
    echo "Warning: QWEN_API_KEY environment variable is not set"
    echo "Please set it before running:"
    echo "  export QWEN_API_KEY=your_api_key_here"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 运行示例
echo ""
echo "Running example..."
echo ""
cd ..
node src/examples.js

echo ""
echo "Done!"
