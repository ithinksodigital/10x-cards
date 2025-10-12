#!/bin/bash
# Diagnostic script for POST /api/generations issues

echo "🔍 Diagnosing POST /api/generations endpoint issues"
echo "====================================================="
echo ""

# Check .env file
echo "1️⃣  Checking environment variables..."
if [ -f .env ]; then
  echo "   ✅ .env file exists"
  if grep -q "SUPABASE_URL" .env; then
    echo "   ✅ SUPABASE_URL is set"
  else
    echo "   ❌ SUPABASE_URL is missing"
  fi
  if grep -q "SUPABASE_KEY" .env; then
    echo "   ✅ SUPABASE_KEY is set"
  else
    echo "   ❌ SUPABASE_KEY is missing"
  fi
else
  echo "   ❌ .env file not found!"
  echo ""
  echo "   Create .env file with:"
  echo "   SUPABASE_URL=https://your-project.supabase.co"
  echo "   SUPABASE_KEY=your-anon-key"
fi
echo ""

# Check if dev server is running
echo "2️⃣  Checking dev server..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
  echo "   ✅ Dev server is running on port 3000"
elif curl -s http://localhost:4321 > /dev/null 2>&1; then
  echo "   ✅ Dev server is running on port 4321"
  echo "   ⚠️  Note: Use port 4321 instead of 3000"
else
  echo "   ❌ Dev server is not running"
  echo "   Run: npm run dev"
fi
echo ""

# Check if endpoint exists
echo "3️⃣  Checking API endpoint file..."
if [ -f "src/pages/api/generations.ts" ]; then
  echo "   ✅ src/pages/api/generations.ts exists"
  
  # Check for hardcoded user ID
  if grep -q "00000000-0000-0000-0000-000000000001" src/pages/api/generations.ts; then
    echo "   ✅ Hardcoded user ID is present"
  else
    echo "   ❌ Hardcoded user ID is missing"
  fi
else
  echo "   ❌ API endpoint file not found"
fi
echo ""

# Check service file
echo "4️⃣  Checking GenerationService..."
if [ -f "src/lib/services/generation.service.ts" ]; then
  echo "   ✅ generation.service.ts exists"
else
  echo "   ❌ generation.service.ts not found"
fi
echo ""

# Check middleware
echo "5️⃣  Checking middleware configuration..."
if [ -f "src/middleware/index.ts" ]; then
  echo "   ✅ middleware/index.ts exists"
  if grep -q "supabaseClient" src/middleware/index.ts; then
    echo "   ✅ Supabase client is configured in middleware"
  else
    echo "   ❌ Supabase client not found in middleware"
  fi
else
  echo "   ❌ middleware/index.ts not found"
fi
echo ""

echo "====================================================="
echo ""
echo "📋 Next steps:"
echo ""
echo "If .env is missing or incomplete:"
echo "  1. Create/update .env file with Supabase credentials"
echo "  2. Restart dev server: npm run dev"
echo ""
echo "If database issues (RLS/permissions):"
echo "  1. Run SQL in Supabase SQL Editor:"
echo "     See: supabase/migrations/99999999999999_mvp_setup.sql"
echo "  2. Or check: .ai/troubleshooting.md"
echo ""
echo "To see detailed error logs:"
echo "  - Check terminal where 'npm run dev' is running"
echo "  - Look for 'Failed to create generation record:' messages"
echo ""
echo "For full troubleshooting guide:"
echo "  cat .ai/troubleshooting.md"


