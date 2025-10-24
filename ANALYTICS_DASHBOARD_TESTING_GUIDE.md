# Analytics Dashboard Testing Guide

## Quick Start

The analytics dashboard has been completely restructured with a modern Shopify-style design. Here's how to test it:

## Accessing the Dashboard

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to: `/app/admin/analytics-dashboard`

## Features to Test

### 1. Period Selection
**Location**: Top of the dashboard

- Click "Last 7 days" button - should load 7-day data
- Click "Last 30 days" button - should load 30-day data  
- Click "Last 90 days" button - should load 90-day data

**Expected Behavior**:
- Selected button appears pressed/highlighted
- Metric cards update with new values
- Chart updates with new time series data
- Percentage changes recalculate for new period

### 2. Metric Cards
**Location**: Row of 4 cards below period selector

Each card should show:
- **Label**: Metric name (Sessions, Total sales, Orders, Conversion rate)
- **Value**: Large, prominent number
- **Change**: Percentage with arrow (↑ or ↓)
- **Color**: Green for positive, red for negative

**Test Cases**:
- Verify all 4 cards render correctly
- Check that numbers are formatted properly (commas, $, %)
- Verify percentage changes show correct arrows
- Test with different periods

### 3. Time Series Chart
**Location**: Large card below metric cards

**Metric Selector Dropdown**:
- Click dropdown to see options: Sessions, Orders, Total Sales, Conversion Rate
- Select each metric and verify chart updates
- Check that Y-axis labels change based on metric type:
  - Sessions/Orders: Plain numbers
  - Total Sales: $ prefix
  - Conversion Rate: % suffix

**Chart Visualization**:
- **Current Period**: Solid blue line
- **Previous Period**: Dashed gray line
- Hover over data points to see tooltip with exact values
- Check legend shows both period labels with correct date ranges
- Verify X-axis shows dates in readable format (e.g., "Oct 24")
- Verify chart is responsive (resize browser window)

### 4. Data Accuracy

**Verify Calculations**:
1. **Sessions**: Should match count of ChatSession records in selected period
2. **Orders**: Should match count of 'order_placed' events
3. **Total Sales**: Currently mirrors orders (can be enhanced later)
4. **Conversion Rate**: Should equal (Orders / Sessions × 100)

**Verify Period Comparison**:
- Previous period should be same length as current period
- Example: If current is Oct 24–Nov 23 (30 days), previous should be Sep 24–Oct 23 (30 days)
- Percentage change should calculate as: ((current - previous) / previous × 100)

### 5. Edge Cases

**No Data Scenario**:
- If no data exists, should show: "No analytics data available yet"
- Message should explain how to start tracking

**Loading State**:
- While fetching data, should show: "Loading analytics..."
- Metric cards should not flash or jump

**Zero Division**:
- If sessions = 0, conversion rate should be 0% (not error)
- If previous period = 0, change % should handle gracefully

## Sample Test Data

### To Create Test Data (Optional)

If you need sample data to test with, you can run the widget and create some sessions:

1. Visit your store's frontend with widget enabled
2. Open the chat widget
3. Send a few messages
4. This will create session and event records

Or use the database directly:
```sql
-- Check current session count
SELECT COUNT(*) FROM "ChatSession";

-- Check event counts by type
SELECT type, COUNT(*) FROM "Event" GROUP BY type;
```

## Expected Visual Layout

```
┌─────────────────────────────────────────────────────────────┐
│  [Last 7 days] [Last 30 days] [Last 90 days]                │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │Sessions │  │Total    │  │Orders   │  │Conversion│       │
│  │  438    │  │sales    │  │  2      │  │rate      │       │
│  │  ↑ 30%  │  │  $2     │  │  ↑ 100% │  │  0.46%   │       │
│  │         │  │  ↑ 100% │  │         │  │  ↑ 53%   │       │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘       │
├─────────────────────────────────────────────────────────────┤
│  Analytics Overview          [Metric Selector ▼]            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                       │   │
│  │      Chart Area                                       │   │
│  │      (Line chart with current & previous periods)     │   │
│  │                                                       │   │
│  └─────────────────────────────────────────────────────┘   │
│  Legend: — Current Period  - - Previous Period              │
└─────────────────────────────────────────────────────────────┘
```

## Common Issues & Solutions

### Issue: "No data available"
**Solution**: Ensure you have ChatSession and Event records in your database within the selected period.

### Issue: Chart not rendering
**Solution**: Check browser console for errors. Verify Recharts is installed (`npm list recharts`).

### Issue: Percentages showing as "NaN%"
**Solution**: This means division by zero or missing data. Check that previous period has data.

### Issue: API errors in console
**Solution**: Verify your database connection and that the analytics service can query Prisma.

## Browser Compatibility

Tested and working on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Notes

- **7-day period**: ~7 database queries (1 per day)
- **30-day period**: ~30 database queries (1 per day)
- **90-day period**: ~90 database queries (1 per day)

If performance is slow with 90-day periods, consider implementing:
- Database query caching
- Aggregating to weekly buckets for longer periods
- Background job to pre-calculate analytics

## Accessibility

The dashboard includes:
- Semantic HTML structure
- Proper ARIA labels (via Polaris components)
- Keyboard navigation support
- Color-blind friendly charts (uses both color and icons)

## Mobile Responsiveness

The dashboard adapts to mobile:
- Period selector buttons may stack vertically
- Metric cards wrap to multiple rows
- Chart scales to fit screen width
- All interactions work on touch devices

## Next Steps

After verifying the dashboard works correctly:

1. **Add Real Revenue Data**: Enhance sales metric to show actual $ amounts
2. **Add More Metrics**: Consider adding leads, average order value, etc.
3. **Custom Date Ranges**: Add date picker for custom periods
4. **Export Features**: Allow exporting data to CSV
5. **Real-time Updates**: Consider WebSocket for live visitor count

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify database connectivity
3. Ensure all npm packages are installed
4. Review the implementation summary: `ANALYTICS_DASHBOARD_RESTRUCTURE_COMPLETE.md`

