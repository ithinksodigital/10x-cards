#!/bin/bash
# Quick test script for POST /api/generations endpoint
# MVP Version - no authorization required

echo "🧪 Testing POST /api/generations endpoint"
echo "=========================================="
echo ""

BASE_URL="http://localhost:4321"
ENDPOINT="/api/generations"

# Test 1: Happy path
echo "✅ Test 1: Happy path (valid request)"
echo "---"
curl -X POST "$BASE_URL$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": "Fotosynteza to podstawowy proces biologiczny zachodzący w roślinach zielonych, glonach i niektórych bakteriach. Polega na przekształcaniu energii świetlnej w energię chemiczną zmagazynowaną w cząsteczce glukozy. Proces ten składa się z dwóch głównych faz.",
    "language": "pl",
    "target_count": 10
  }' \
  -w "\nHTTP Status: %{http_code}\n"

echo ""
echo ""

# Test 2: Minimal valid request
echo "✅ Test 2: Minimal request (only source_text)"
echo "---"
curl -X POST "$BASE_URL$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": "To jest minimalny prawidłowy tekst źródłowy do generacji fiszek AI. Musi mieć co najmniej sto znaków, aby spełnić wymagania walidacji."
  }' \
  -w "\nHTTP Status: %{http_code}\n"

echo ""
echo ""

# Test 3: Invalid - text too short
echo "❌ Test 3: Invalid - text too short"
echo "---"
curl -X POST "$BASE_URL$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": "Za krótki tekst",
    "target_count": 10
  }' \
  -w "\nHTTP Status: %{http_code}\n"

echo ""
echo ""

# Test 4: Invalid - target_count out of range
echo "❌ Test 4: Invalid - target_count out of range"
echo "---"
curl -X POST "$BASE_URL$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": "Prawidłowy tekst źródłowy o odpowiedniej długości, który spełnia wszystkie wymagania dotyczące minimalnej liczby znaków wymaganych do generacji.",
    "target_count": 100
  }' \
  -w "\nHTTP Status: %{http_code}\n"

echo ""
echo ""

# Test 5: Invalid - bad language code
echo "❌ Test 5: Invalid - bad language code"
echo "---"
curl -X POST "$BASE_URL$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": "Prawidłowy tekst źródłowy o odpowiedniej długości, który spełnia wszystkie wymagania dotyczące minimalnej liczby znaków wymaganych do generacji.",
    "language": "polish",
    "target_count": 10
  }' \
  -w "\nHTTP Status: %{http_code}\n"

echo ""
echo ""
echo "=========================================="
echo "🎉 Tests completed!"
echo ""
echo "Expected results:"
echo "  - Test 1: HTTP 202 (Accepted)"
echo "  - Test 2: HTTP 202 (Accepted)"
echo "  - Test 3: HTTP 400 (Bad Request)"
echo "  - Test 4: HTTP 400 (Bad Request)"
echo "  - Test 5: HTTP 400 (Bad Request)"
echo ""
echo "Note: Make sure dev server is running (npm run dev)"


