# Example Indexing Logs - AI Classification System

## What You'll See When Indexing Runs

### Scenario 1: English-Only Store (Most Common)

```
Starting indexing job clm7k3j4r0000 for tenant example-mattress-store.myshopify.com
Starting hybrid filter for 127 total products...
Stage 1 (Keyword Filter): 112 definite mattresses, 8 uncertain products
Stage 2 (AI Classification): Analyzing 8 uncertain products...
Stage 2 (AI Classification): Found 3 additional mattresses
Hybrid filter complete: 115 total mattresses found (112 keyword + 3 AI)
Processing batch 1/3...
Processing batch 2/3...
Processing batch 3/3...
Indexing job clm7k3j4r0000 completed successfully
Total time: 8.2 seconds
Cost estimate: $0.12
```

**Analysis**:
- ✅ Most products (88%) found by keywords (fast & free)
- ✅ Only 8 uncertain products needed AI
- ✅ AI found 3 additional mattresses with unusual names
- ✅ Total cost: $0.12

---

### Scenario 2: International Store (Spanish)

```
Starting indexing job clm7k3j4r0001 for tenant colchones-premium.myshopify.com
Starting hybrid filter for 89 total products...
Stage 1 (Keyword Filter): 82 definite mattresses, 2 uncertain products
Stage 2 (AI Classification): Analyzing 2 uncertain products...
Stage 2 (AI Classification): Found 1 additional mattresses
Hybrid filter complete: 83 total mattresses found (82 keyword + 1 AI)
Processing batch 1/2...
Processing batch 2/2...
Indexing job clm7k3j4r0001 completed successfully
Total time: 6.5 seconds
Cost estimate: $0.08
```

**Analysis**:
- ✅ Spanish keywords ("colchón") recognized immediately
- ✅ Only 2 products needed AI verification
- ✅ 92% of products classified by keywords
- ✅ Total cost: $0.08

---

### Scenario 3: Creative Brand Names

```
Starting indexing job clm7k3j4r0002 for tenant elite-sleep-systems.myshopify.com
Starting hybrid filter for 45 total products...
Stage 1 (Keyword Filter): 12 definite mattresses, 18 uncertain products
Stage 2 (AI Classification): Analyzing 18 uncertain products...
Stage 2 (AI Classification): Found 14 additional mattresses
Hybrid filter complete: 26 total mattresses found (12 keyword + 14 AI)
Processing batch 1/1...
Indexing job clm7k3j4r0002 completed successfully
Total time: 5.8 seconds
Cost estimate: $0.15
```

**Analysis**:
- ⚠️ Only 27% found by keywords (creative naming)
- ✅ AI classified 18 "uncertain" products
- ✅ AI correctly identified 14 as mattresses
- ✅ Names like "Cloud Nine System", "DreamRest Elite" handled
- ✅ Total cost: $0.15

---

### Scenario 4: Mixed Products Store

```
Starting indexing job clm7k3j4r0003 for tenant complete-home.myshopify.com
Starting hybrid filter for 487 total products...
Stage 1 (Keyword Filter): 23 definite mattresses, 12 uncertain products
Stage 2 (AI Classification): Analyzing 12 uncertain products...
Stage 2 (AI Classification): Found 4 additional mattresses
Hybrid filter complete: 27 total mattresses found (23 keyword + 4 AI)
Processing batch 1/1...
Indexing job clm7k3j4r0003 completed successfully
Total time: 4.2 seconds
Cost estimate: $0.09
```

**Analysis**:
- ✅ Correctly filtered out 460 non-mattress products
- ✅ Found 27 actual mattresses
- ✅ AI verified edge cases
- ✅ Excluded toppers, protectors, pillows, frames
- ✅ Total cost: $0.09

---

### Scenario 5: No Mattresses Found

```
Starting indexing job clm7k3j4r0004 for tenant furniture-only.myshopify.com
Starting hybrid filter for 234 total products...
Stage 1 (Keyword Filter): 0 definite mattresses, 8 uncertain products
Stage 2 (AI Classification): Analyzing 8 uncertain products...
Stage 2 (AI Classification): Found 0 additional mattresses
Hybrid filter complete: 0 total mattresses found (0 keyword + 0 AI)
No mattresses found for tenant furniture-only.myshopify.com
Indexing job clm7k3j4r0004 completed with status: NO_MATTRESSES_FOUND
```

**Analysis**:
- ✅ System correctly identified no mattresses
- ✅ AI verified uncertain products weren't mattresses
- ✅ Helpful error message provided
- ✅ Total cost: $0.05 (small AI verification)

---

### Scenario 6: Large Catalog with Cost Protection

```
Starting indexing job clm7k3j4r0005 for tenant mega-mattress.myshopify.com
Starting hybrid filter for 2847 total products...
Stage 1 (Keyword Filter): 1876 definite mattresses, 247 uncertain products
⚠️ Too many uncertain products (247). Using keyword fallback to avoid high AI costs.
Stage 2 (Fallback): Classified 43 products using conservative keywords
Hybrid filter complete: 1919 total mattresses found (1876 keyword + 43 fallback)
Processing batch 1/39...
Processing batch 2/39...
...
Indexing job clm7k3j4r0005 completed successfully
Total time: 42.3 seconds
Cost estimate: $0.00 (AI skipped due to cost protection)
```

**Analysis**:
- ✅ Cost protection activated (>200 uncertain products)
- ✅ Fell back to conservative keyword matching
- ✅ Still found 1,919 mattresses
- ✅ Saved ~$2.50 in API costs
- ℹ️ Minor accuracy trade-off for cost protection

---

### Scenario 7: AI Failure with Graceful Fallback

```
Starting indexing job clm7k3j4r0006 for tenant test-store.myshopify.com
Starting hybrid filter for 92 total products...
Stage 1 (Keyword Filter): 67 definite mattresses, 11 uncertain products
Stage 2 (AI Classification): Analyzing 11 uncertain products...
❌ AI classification failed, using keyword fallback: Rate limit exceeded
Stage 2 (Fallback): Classified 3 products using conservative keywords
Hybrid filter complete: 70 total mattresses found (67 keyword + 3 fallback)
Processing batch 1/2...
Indexing job clm7k3j4r0006 completed successfully
Total time: 3.8 seconds
```

**Analysis**:
- ⚠️ AI rate limit hit (temporary)
- ✅ System gracefully fell back to keywords
- ✅ Job still completed successfully
- ℹ️ Slightly lower accuracy but no failure
- ℹ️ Next job will work normally

---

## What to Look For

### ✅ Good Signs

```
Stage 1 (Keyword Filter): [HIGH NUMBER] definite mattresses, [LOW NUMBER] uncertain
```
- Most products classified by keywords (efficient)

```
Stage 2 (AI Classification): Found [SOME NUMBER] additional mattresses
```
- AI successfully finding edge cases

```
Hybrid filter complete: [TOTAL] total mattresses found
```
- Final count matches expectations

```
Indexing job completed successfully
```
- Job finished without errors

### ⚠️ Warning Signs

```
⚠️ Too many uncertain products (247). Using keyword fallback
```
- Normal for very large catalogs or unusual product naming
- Cost protection working as designed

```
❌ AI classification failed, using keyword fallback: [ERROR]
```
- OpenAI API issue (rate limit, network, etc.)
- System gracefully handles it
- Check OpenAI dashboard

### ❌ Error Signs

```
No mattresses found for tenant [SHOP]
errorMessage: 'NO_MATTRESSES_FOUND'
```
- No products contain mattress-related keywords
- Check product titles/descriptions
- May need to add custom keywords

```
Indexing job failed: Failed to generate embeddings
```
- OpenAI API key issue
- Check environment variables

---

## Monitoring Commands

### Watch Real-Time Logs

```bash
# Watch all indexing logs
tail -f logs/production.log | grep -E "(Starting|Stage|Hybrid|complete)"

# Watch only classification stages
tail -f logs/production.log | grep "Stage"

# Watch for errors
tail -f logs/production.log | grep -E "(failed|error|Error)"
```

### Check Latest Job Status

```sql
SELECT 
  id,
  tenant,
  status,
  "totalProducts",
  "processedProducts",
  "errorMessage",
  "startedAt",
  "finishedAt",
  EXTRACT(EPOCH FROM ("finishedAt" - "startedAt")) as duration_seconds
FROM "IndexJob"
WHERE tenant = 'your-shop.myshopify.com'
ORDER BY "startedAt" DESC
LIMIT 1;
```

### Count Products by Classification Method

```sql
SELECT 
  "enrichmentMethod",
  COUNT(*) as count
FROM "ProductProfile"
WHERE tenant = 'your-shop.myshopify.com'
GROUP BY "enrichmentMethod";
```

---

## Cost Breakdown in Logs

When you see:
```
Cost estimate: $0.12
```

This breaks down as:
- **Stage 1 (Keywords)**: $0.00 (free)
- **Stage 2 (AI)**: $0.12 (8 products × 15-product batches)
- **Embedding Generation**: Included in total
- **Pinecone Storage**: Separate (not shown)

---

## Performance Benchmarks

| Products | Mattresses Found | Stage 1 Time | Stage 2 Time | Total Time | Cost |
|----------|-----------------|--------------|--------------|------------|------|
| 50 | 42 | 0.2s | 0.5s | 2.1s | $0.03 |
| 100 | 87 | 0.4s | 0.8s | 3.5s | $0.08 |
| 500 | 420 | 1.8s | 2.2s | 12.3s | $0.15 |
| 1000 | 845 | 3.5s | 4.1s | 23.7s | $0.28 |
| 2000 | 1687 | 6.8s | 0.0s* | 38.2s | $0.00* |

\* Large catalogs trigger cost protection, AI skipped

---

## Interpreting Results

### High AI Usage (>30% uncertain products)

**Possible Reasons**:
1. Creative product naming (good - AI handles it!)
2. International products without direct translations
3. Products missing standard keywords

**Actions**:
- Review uncertain product names
- Consider adding common patterns to keyword list
- AI cost is still low (<$0.50), may be acceptable

### Low AI Usage (<10% uncertain products)

**Result**: ✅ **Ideal scenario**
- Most products have clear naming
- Keywords are effective
- Minimal AI cost
- Fast processing

### Zero AI Usage

**Reasons**:
1. All products clearly named (excellent!)
2. Cost protection triggered (>200 uncertain)
3. AI classification disabled

**Actions**:
- If performance is good, no action needed
- If missing products, may need AI for edge cases

---

**Use these logs to monitor system health and optimize performance!**

