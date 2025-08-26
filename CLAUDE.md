# Claude Development Notes

## Feature Flags

### Clarity Multi-Context (clarity_multi_context)

**Purpose**: Controls the Clarity scene's multi-input AI enhancement feature.

**Default**: Enabled (`true`)

**Usage**: 
- Set `localStorage.setItem('clarity_multi_context', 'false')` to disable
- Set `localStorage.setItem('clarity_multi_context', 'true')` or remove the key to enable

**Behavior**:
- **Enabled**: Uses all input fields (inspiration, working, recurring thought, jealousy, recent moment, felt natural) for AI chip generation with weighted context processing
- **Disabled**: Falls back to single-input mode using only the "What inspires you?" field

**Rollback Plan**:
1. Set feature flag to false: `localStorage.setItem('clarity_multi_context', 'false')`
2. Monitor error rates return to baseline
3. Gradual rollout: 10% → 50% → 100% with rollback thresholds

## Test Commands

```bash
# Run all tests
npm test

# Run specific test suites
npm test clarity_multi_input.test.tsx
npm test ml.test.ts

# Run linting and type checking
npm run lint
npm run typecheck
```

## Telemetry Events

### clarity_multi_input_used
Tracks when multi-context AI suggestions are generated.

**Fields**:
- `field_count`: Number of filled input fields
- `context_length`: Total character count of all context
- `chip_count`: Number of chips returned
- `top_chip_source`: Source of highest ranked chip ('seed' | 'user')
- `processing_time`: ML processing time in milliseconds

### clarity_trait_selected
Tracks when a user selects a trait chip.

**Fields**:
- `trait_text`: The selected trait text
- `input_contexts`: Array of field names that had input
- `ranking_score`: ML ranking score (optional)
- `synonym_matched`: Whether trait matched synonyms in context

## Acceptance Criteria Status

✅ `getSuggestionsWithContext()` accepts ContextBundle and returns SuggestResult
✅ Clarity chips update when ANY input field changes (not just inspiration)  
✅ Trait vocabulary includes "positive" and "optimistic" with synonyms
✅ "I admire my partners positivity" generates "positive" chip in top results
✅ Multi-input context produces different suggestions than single-input
✅ Synonym matching boosts relevant traits (upbeat → positive)
✅ Feature flag controls multi-context behavior
✅ Telemetry tracks multi-input usage and performance
✅ Unit tests pass for all new functions
✅ E2E tests pass for dynamic chip updates