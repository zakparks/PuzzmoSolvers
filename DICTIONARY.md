# Dictionary System

## Overview

The Puzzmo Solvers app uses a two-tier dictionary validation system to minimize API calls and avoid rate limiting:

1. **Local Dictionary** (Primary) - 370,000+ English words loaded from a static file
2. **Wordnik API** (Fallback) - Only used when explicitly enabled

## How It Works

### Local Dictionary (`lib/dictionary.ts`)

- Loads `/public/words.txt` containing 370,000+ English words
- Cached in memory after first load
- Instant validation with no API calls
- Uses the popular [dwyl/english-words](https://github.com/dwyl/english-words) word list

### Validation Flow (`lib/wordnik.ts`)

```typescript
isValidWord(word, useWordnik = false)
```

1. Check in-memory cache
2. Check local dictionary (fast, no API call)
3. If `useWordnik` is true and word not found locally, check Wordnik API
4. Cache result

### Usage in Solvers

All solvers automatically use the local dictionary by default:

```typescript
// Uses local dictionary only (no API calls)
const isValid = await isValidWord("hello");

// Uses local dictionary first, then Wordnik if not found
const isValid = await isValidWord("obscureword", true);
```

## Benefits

- **No Rate Limiting**: Local dictionary handles 99%+ of common words
- **Instant Validation**: No network latency for most words
- **Offline Support**: Works without internet connection
- **Cost Reduction**: Minimizes Wordnik API usage

## Dictionary File

- **Location**: `/public/words.txt`
- **Size**: ~4.1 MB
- **Words**: 370,105 English words (lowercase, alphabetically sorted)
- **Source**: https://github.com/dwyl/english-words

## Performance

- Dictionary loads once on app initialization (~500ms)
- Subsequent lookups are instant (Set lookup: O(1))
- All solver validations happen locally without API calls

## Future Enhancements

- Could add more specialized dictionaries (proper nouns, technical terms)
- Could implement progressive loading for faster initial load
- Could add word frequency data for better solver optimization
