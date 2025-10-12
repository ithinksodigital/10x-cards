# API Testing Guide

## Quick Start

### 1. Run Basic Tests (No Auth Required)

```bash
node .ai/test-simple.js
```

This will test:
- Authentication enforcement (401 errors)
- UUID validation (400 errors)
- Error message formatting

Expected: All tests should pass with proper error responses.

---

### 2. Run Interactive Tests (Auth Required)

```bash
./.ai/test-api-endpoints.sh
```

**Prerequisites:**
- `jq` installed (`brew install jq` on macOS)
- Valid Supabase JWT token

**Setup:**
Edit the script and replace the token:
```bash
AUTH_TOKEN="your-supabase-jwt-token-here"
```

---

## Getting Supabase JWT Token

### Option 1: From Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Users**
3. Create a test user or select existing user
4. Click on the user to see details
5. Copy the **JWT Token** (access token)

### Option 2: Using Supabase CLI

```bash
# Login to Supabase
supabase login

# Start local development
supabase start

# Create a test user
supabase auth signup --email test@example.com --password testpass123

# The response will include the access_token
```

### Option 3: Programmatically (Node.js)

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'your-project-url',
  'your-anon-key'
)

const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'testpass123'
})

console.log('Token:', data.session?.access_token)
```

---

## Test Scenarios

### Scenario 1: Complete CRUD Flow

```bash
# 1. Create a set
curl -X POST http://localhost:3001/api/sets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name": "Spanish 101", "language": "es"}'

# Save the returned ID
SET_ID="uuid-from-response"

# 2. Create a card
curl -X POST http://localhost:3001/api/sets/$SET_ID/cards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"front": "Hola", "back": "Hello"}'

# Save the card ID
CARD_ID="uuid-from-response"

# 3. List cards
curl http://localhost:3001/api/sets/$SET_ID/cards \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Update card
curl -X PATCH http://localhost:3001/api/cards/$CARD_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"front": "¡Hola!"}'

# 5. Get card details
curl http://localhost:3001/api/cards/$CARD_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Scenario 2: SRS Learning Flow

```bash
# 1. Get due cards
curl http://localhost:3001/api/srs/due \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. Start session
curl -X POST http://localhost:3001/api/srs/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "set_id": "your-set-id",
    "new_cards_limit": 10,
    "review_cards_limit": 20
  }'

# Save session ID
SESSION_ID="uuid-from-response"

# 3. Submit review (rating 1-5)
curl -X POST http://localhost:3001/api/srs/reviews \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "card_id": "your-card-id",
    "rating": 4,
    "session_id": "'$SESSION_ID'"
  }'

# 4. Get session summary
curl http://localhost:3001/api/srs/sessions/$SESSION_ID/summary \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Scenario 3: Batch Card Creation

```bash
curl -X POST http://localhost:3001/api/sets/$SET_ID/cards/batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "generation_id": "your-generation-id",
    "cards": [
      {
        "front": "Hola",
        "back": "Hello",
        "was_edited": false,
        "ai_confidence_score": 0.95
      },
      {
        "front": "Adiós",
        "back": "Goodbye",
        "was_edited": false,
        "ai_confidence_score": 0.92
      }
    ]
  }'
```

---

## Testing Limits

### Test Set Limit (200 cards)

```bash
# Create 200 cards (use loop)
for i in {1..200}; do
  curl -X POST http://localhost:3001/api/sets/$SET_ID/cards \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -d '{"front": "Card '$i'", "back": "Back '$i'"}'
done

# Try to create 201st (should fail with 422)
curl -X POST http://localhost:3001/api/sets/$SET_ID/cards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"front": "Card 201", "back": "Back 201"}'
```

Expected response:
```json
{
  "error": "LimitExceeded",
  "message": "Set has reached maximum of 200 cards",
  "code": "LIMIT_EXCEEDED",
  "details": {
    "set_limit": 200,
    "current_count": 200
  }
}
```

---

### Test User Limit (1000 cards)

Similar to above, but across multiple sets. When you reach 1000:

Expected response:
```json
{
  "error": "LimitExceeded",
  "message": "User has reached maximum of 1000 cards",
  "code": "LIMIT_EXCEEDED",
  "details": {
    "user_limit": 1000,
    "current_count": 1000
  }
}
```

---

### Test Daily Limits

```bash
# Review 20 new cards in one day
# The 21st should fail with:
{
  "error": "DailyLimitReached",
  "message": "You have reached your daily limit for new cards",
  "code": "DAILY_LIMIT_REACHED",
  "details": {
    "new_cards_today": 20,
    "new_cards_limit": 20
  }
}
```

---

## Testing Error Scenarios

### Invalid UUID
```bash
curl http://localhost:3001/api/sets/invalid-uuid \
  -H "Authorization: Bearer YOUR_TOKEN"
```
Expected: 400 Bad Request

### Missing Required Fields
```bash
curl -X POST http://localhost:3001/api/sets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{}'
```
Expected: 400 Validation Error

### Duplicate Card
```bash
# Create card
curl -X POST http://localhost:3001/api/sets/$SET_ID/cards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"front": "Hola", "back": "Hello"}'

# Try to create same card (case-insensitive)
curl -X POST http://localhost:3001/api/sets/$SET_ID/cards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"front": "hola", "back": "Hi"}'
```
Expected: 409 Conflict

### Invalid Rating
```bash
curl -X POST http://localhost:3001/api/srs/reviews \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "card_id": "some-uuid",
    "rating": 10,
    "session_id": "some-uuid"
  }'
```
Expected: 400 Validation Error (rating must be 1-5)

---

## Using Postman or Insomnia

### Import Collection

Create a collection with these requests:

1. **Environment Variables:**
   - `base_url`: http://localhost:3001
   - `auth_token`: your-jwt-token

2. **Headers (Global):**
   - `Content-Type`: application/json
   - `Authorization`: Bearer {{auth_token}}

3. **Import from cURL:**
   Both tools support importing cURL commands directly.

---

## Automated Testing with Jest (Optional)

If you want to add automated tests:

```bash
npm install --save-dev jest @types/jest
```

Create `tests/api.test.js`:

```javascript
describe('API Endpoints', () => {
  const BASE_URL = 'http://localhost:3001';
  const AUTH_TOKEN = process.env.AUTH_TOKEN;

  test('should require authentication', async () => {
    const response = await fetch(`${BASE_URL}/api/sets`);
    expect(response.status).toBe(401);
  });

  test('should validate UUID format', async () => {
    const response = await fetch(`${BASE_URL}/api/sets/invalid-uuid`, {
      headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
    });
    expect(response.status).toBe(400);
  });

  // Add more tests...
});
```

---

## Troubleshooting

### Issue: 401 Unauthorized even with token

**Solution:**
- Verify token is not expired
- Check token format (should be JWT)
- Ensure Authorization header format: `Bearer TOKEN`
- Verify Supabase project URL matches

### Issue: Connection refused

**Solution:**
- Ensure dev server is running: `npm run dev`
- Check correct port (default: 3001)
- Verify no firewall blocking

### Issue: Database errors

**Solution:**
- Check Supabase connection
- Verify environment variables set
- Check RLS policies enabled
- Ensure migrations ran successfully

### Issue: Slow responses

**Solution:**
- Check database indexes
- Verify RLS policies are optimized
- Check network connection to Supabase
- Monitor Supabase dashboard for issues

---

## Tips for Effective Testing

1. **Start Simple:** Begin with GET requests before POST/PATCH/DELETE
2. **Save IDs:** Keep track of created resource IDs for subsequent tests
3. **Test Order:** Follow logical flow (create → read → update → delete)
4. **Clean Up:** Delete test data after testing
5. **Use Variables:** Store common values (tokens, IDs) in variables
6. **Check Logs:** Monitor server logs for detailed error info
7. **Test Edge Cases:** Empty strings, very long strings, special characters
8. **Test Concurrency:** Multiple sessions, simultaneous reviews

---

## Next Steps

1. ✅ Run basic tests without authentication
2. ⏳ Get Supabase JWT token
3. ⏳ Run authenticated tests
4. ⏳ Test all CRUD operations
5. ⏳ Test SRS flow
6. ⏳ Test limits and constraints
7. ⏳ Test error scenarios
8. ⏳ Integration with frontend

---

## Resources

- [API Documentation](.ai/api-endpoints-implemented.md)
- [Implementation Plan](.ai/view-implementation-plan-2.md)
- [Testing Results](.ai/testing-results.md)
- [Test Scripts](.ai/test-api-endpoints.sh)
