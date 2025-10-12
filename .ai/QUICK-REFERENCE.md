# Quick Reference - API Endpoints

## 🚀 Quick Start

```bash
# Start dev server
npm run dev

# Run basic tests
node .ai/test-simple.js

# Interactive testing
./.ai/test-api-endpoints.sh
```

---

## 📍 All Endpoints

### Sets (5 endpoints)
```
GET    /api/sets              # List sets
POST   /api/sets              # Create set
GET    /api/sets/:id          # Get set
PATCH  /api/sets/:id          # Update set
DELETE /api/sets/:id          # Delete set
```

### Cards (6 endpoints)
```
GET    /api/sets/:setId/cards       # List cards
POST   /api/sets/:setId/cards       # Create card
POST   /api/sets/:setId/cards/batch # Batch create
GET    /api/cards/:id               # Get card
PATCH  /api/cards/:id               # Update card
DELETE /api/cards/:id               # Delete card
```

### SRS (4 endpoints)
```
GET    /api/srs/due                      # Get due cards
POST   /api/srs/sessions                 # Start session
POST   /api/srs/reviews                  # Submit review
GET    /api/srs/sessions/:id/summary     # Session stats
```

---

## 🔑 Authentication

All endpoints require:
```
Authorization: Bearer <jwt-token>
```

---

## 📝 Common Requests

### Create Set
```bash
curl -X POST http://localhost:3001/api/sets \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Spanish", "language": "es"}'
```

### Create Card
```bash
curl -X POST http://localhost:3001/api/sets/SET_ID/cards \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"front": "Hola", "back": "Hello"}'
```

### Start Session
```bash
curl -X POST http://localhost:3001/api/srs/sessions \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "set_id": "SET_ID",
    "new_cards_limit": 10,
    "review_cards_limit": 20
  }'
```

### Submit Review
```bash
curl -X POST http://localhost:3001/api/srs/reviews \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "card_id": "CARD_ID",
    "rating": 4,
    "session_id": "SESSION_ID"
  }'
```

---

## ⚠️ Common Errors

```
401 Unauthorized     → Missing/invalid token
400 Bad Request      → Validation error
404 Not Found        → Resource doesn't exist
409 Conflict         → Duplicate (name/card)
422 Unprocessable    → Limit exceeded
```

---

## 📊 Limits

```
Cards per set:     200
Cards per user:    1,000
New cards/day:     20
Reviews/day:       100
Batch size:        1-30 cards
```

---

## 🎯 Rating Scale (SRS)

```
1 - Again    (complete failure)
2 - Hard     (incorrect but familiar)
3 - Good     (correct with difficulty)
4 - Easy     (perfect recall)
5 - Perfect  (immediate recall)
```

---

## 📂 File Structure

```
src/
├── lib/
│   ├── errors.ts              # Error classes
│   ├── api-utils.ts           # API helpers
│   ├── schemas.ts             # Zod schemas
│   └── services/
│       ├── set.service.ts     # Set CRUD
│       ├── card.service.ts    # Card CRUD + limits
│       └── srs.service.ts     # SM-2 algorithm
└── pages/api/
    ├── sets.ts                # List, Create
    ├── sets/[id].ts           # Get, Update, Delete
    ├── sets/[setId]/cards.ts  # List cards, Create card
    ├── cards/[id].ts          # Get, Update, Delete card
    └── srs/
        ├── due.ts             # Due cards
        ├── sessions.ts        # Start session
        └── reviews.ts         # Submit review
```

---

## 🧪 Testing Files

```
.ai/test-simple.js           # Quick Node.js tests
.ai/test-api-endpoints.sh    # Interactive bash script
.ai/TESTING-GUIDE.md         # Complete guide
.ai/testing-results.md       # Test results
```

---

## 📚 Documentation

```
.ai/api-endpoints-implemented.md  # Complete API reference
.ai/TESTING-GUIDE.md              # How to test
.ai/testing-results.md            # Test results
.ai/SUMMARY.md                    # Implementation summary
.ai/QUICK-REFERENCE.md            # This file
```

---

## 🔧 Troubleshooting

**Dev server not running?**
```bash
npm run dev
```

**Port already in use?**
- Dev server will auto-select next port
- Check console output for actual port

**401 errors?**
- Get JWT token from Supabase
- Add to Authorization header

**Database errors?**
- Check Supabase connection
- Verify environment variables
- Run migrations

---

## 💡 Tips

1. Save resource IDs after creation
2. Test in order: Set → Card → Session → Review
3. Check server logs for detailed errors
4. Use jq for pretty JSON: `curl ... | jq`
5. Keep track of daily limits (reset at midnight)

---

## 🆘 Need Help?

- **API Documentation:** `.ai/api-endpoints-implemented.md`
- **Testing Guide:** `.ai/TESTING-GUIDE.md`
- **Implementation Plan:** `.ai/view-implementation-plan-2.md`
- **Summary:** `.ai/SUMMARY.md`

---

## ✅ Checklist for Testing

- [ ] Dev server running
- [ ] Supabase connected
- [ ] JWT token obtained
- [ ] Create test set
- [ ] Create test cards
- [ ] List resources
- [ ] Start SRS session
- [ ] Submit reviews
- [ ] Check limits work
- [ ] Test error scenarios

---

**Last Updated:** October 12, 2025  
**Status:** All 15 endpoints implemented and tested ✅

