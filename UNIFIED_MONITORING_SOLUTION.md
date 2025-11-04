# Unified Monitoring Solution - Data Consistency Fix

## Overview

This solution addresses the data inconsistency between cards and charts on the `/monitoring-order` page by implementing a unified data architecture that ensures all dashboard elements use the same filtered dataset and aggregation logic.

## Problem Statement

The original monitoring system had several issues:
- **Inconsistent filtering**: Cards and charts used different filter logic
- **Separate data sources**: Each component fetched data independently
- **No unified aggregation**: Different counting methods led to mismatched totals
- **Missing data validation**: No consistency checks between components
- **No shared timestamp**: Different data snapshots caused timing discrepancies

## Solution Architecture

### 1. Unified Backend API (`/query/monitoring-unified`)

**Location**: `backend/routes/query.py`

**Key Features**:
- Single endpoint that returns both cards and charts data
- Unified filtering system (dateRange, brand, marketplace, status)
- Consistent aggregation using the same base dataset
- Built-in data validation and consistency checks
- Shared data timestamp for all components

**SQL Query Structure**:
```sql
SELECT
    so.SystemId,
    so.MerchantName,
    so.SystemRefId,
    so.OrderStatus,
    so.Status_Interfaced,
    so.OrderDate,
    -- ... other fields
FROM Flexo_Db.dbo.SalesOrder so
LEFT JOIN WMSPROD.dbo.ord_line ol ON ol.ordnum = so.SystemRefId
WHERE so.SystemRefId IN (?) 
  AND so.OrderDate >= ? AND so.OrderDate <= ?
  AND so.MerchantName = ?
  AND so.SystemId = ?
  AND so.OrderStatus NOT IN ('cancelled', 'unpaid', 'pending_payment')
GROUP BY so.SystemId, so.SystemRefId, so.MerchantName, so.OrderDate, ...
```

**Response Structure**:
```json
{
  "status": "success",
  "data": {
    "results": [...], // Full dataset for table
    "cards": {
      "total_orders": 1500,
      "interfaced": 1200,
      "not_interfaced": 300,
      "pending_verification": 50,
      "hour_minus_1": 25,
      "hour_plus_1": 30
    },
    "charts": {
      "top_brands": [{"name": "Brand A", "value": 500}, ...],
      "platform_distribution": [{"name": "Shopee", "value": 800}, ...],
      "order_evolution": [{"name": "2024-01-01 10:00", "value": 45}, ...]
    },
    "filters_applied": {...},
    "data_timestamp": "2024-01-01T10:00:00Z"
  }
}
```

### 2. Unified Frontend Hook (`useUnifiedMonitoring`)

**Location**: `frontend/src/pages/Monitoring/hooks/useUnifiedMonitoring.js`

**Key Features**:
- Centralized state management for all monitoring data
- Unified filter state and management
- Data consistency validation
- Caching and performance optimization
- Error handling and notifications

**Usage**:
```javascript
const {
  isLoading,
  error,
  unifiedData,
  filters,
  processUnifiedData,
  updateFilters,
  getCardsData,
  getChartsData,
  getTableData,
  isDataFresh
} = useUnifiedMonitoring();
```

### 3. Unified Filter Component (`UnifiedFilters`)

**Location**: `frontend/src/pages/Monitoring/components/UnifiedFilters.jsx`

**Key Features**:
- Single filter interface for all components
- Date range picker with validation
- Brand and marketplace dropdowns
- Status exclusion filters
- Real-time filter application
- Data freshness indicators

**Filter Types**:
- **DateRange**: Start and end dates for order filtering
- **Brand**: Filter by specific merchant/brand
- **Marketplace**: Filter by platform (Shopee, Lazada, etc.)
- **Status**: Exclude specific order statuses (cancelled, unpaid, pending_payment)

### 4. Unified Cards Component (`UnifiedCards`)

**Location**: `frontend/src/pages/Monitoring/components/UnifiedCards.jsx`

**Key Features**:
- Displays consistent card data from unified source
- Trend indicators based on performance thresholds
- Percentage calculations for interfaced orders
- Data freshness indicators
- Summary statistics

**Card Metrics**:
- Total Orders: `COUNT(DISTINCT SystemRefId)`
- Interfaced: `COUNT(DISTINCT SystemRefId WHERE Status_Interfaced = 'Yes')`
- Not Interfaced: `COUNT(DISTINCT SystemRefId WHERE Status_Interfaced = 'No')`
- Pending Verification: `COUNT(DISTINCT SystemRefId WHERE Status_SC = 'Pending Verifikasi')`
- Last Hour Orders: `COUNT(DISTINCT SystemRefId WHERE OrderDate >= NOW() - INTERVAL 1 HOUR)`
- Previous Hour Orders: `COUNT(DISTINCT SystemRefId WHERE OrderDate < NOW() - INTERVAL 1 HOUR)`

### 5. Unified Charts Component (`UnifiedCharts`)

**Location**: `frontend/src/pages/Monitoring/components/UnifiedCharts.jsx`

**Key Features**:
- Consistent chart data from unified source
- Data validation and consistency checks
- Interactive tooltips with detailed information
- Responsive design for different screen sizes
- Performance optimizations

**Chart Types**:
- **Top Brands**: Horizontal bar chart showing top 10 brands by order count
- **Platform Distribution**: Pie chart showing order distribution by marketplace
- **Order Evolution**: Line chart showing order count over time (last 24 hours)

### 6. Main Unified Page (`UnifiedMonitoringPage`)

**Location**: `frontend/src/pages/Monitoring/UnifiedMonitoringPage.jsx`

**Key Features**:
- Integrates all unified components
- System Reference ID input and processing
- Data export functionality
- Loading states and error handling
- Responsive layout

## Data Consistency Validation

### Backend Validation
```python
# Calculate unified metrics for cards
total_orders = len(results)
interfaced_count = sum(1 for row in results if row.get('Status_Interfaced') == 'Yes')
not_interfaced_count = sum(1 for row in results if row.get('Status_Interfaced') == 'No')

# Calculate chart data from same dataset
brand_counts = {}
for row in results:
    brand = row.get('MerchantName', 'Unknown')
    brand_counts[brand] = brand_counts.get(brand, 0) + 1

# Validate consistency
assert total_orders == sum(brand_counts.values())
```

### Frontend Validation
```javascript
const validateDataConsistency = (data) => {
  const warnings = [];
  const totalOrders = data.cards.total_orders;
  
  // Check if chart sums match total orders
  const topBrandsSum = data.charts.top_brands.reduce((sum, item) => sum + item.value, 0);
  if (totalOrders !== topBrandsSum) {
    warnings.push(`Top brands sum doesn't match total orders`);
  }
  
  return { isValid: warnings.length === 0, warnings };
};
```

## Implementation Steps

### 1. Backend Setup
1. Add the new unified endpoint to `backend/routes/query.py`
2. Test the endpoint with sample data
3. Verify SQL query performance and optimization

### 2. Frontend Setup
1. Create the unified monitoring hook
2. Implement unified filter component
3. Create unified cards and charts components
4. Build the main unified monitoring page

### 3. Integration
1. Replace existing monitoring components with unified versions
2. Update routing to use the new unified page
3. Test data consistency across all components
4. Validate performance and user experience

### 4. Testing
1. Test with various filter combinations
2. Verify data consistency between cards and charts
3. Test error handling and edge cases
4. Performance testing with large datasets

## Benefits

### 1. Data Consistency
- All components use the same filtered dataset
- Consistent aggregation logic across cards and charts
- Real-time validation of data consistency

### 2. Performance
- Single API call instead of multiple requests
- Optimized SQL queries with proper indexing
- Frontend caching and state management

### 3. User Experience
- Unified filter interface
- Real-time data freshness indicators
- Consistent visual design across components
- Better error handling and feedback

### 4. Maintainability
- Centralized data logic
- Reusable components
- Clear separation of concerns
- Comprehensive documentation

## Usage Examples

### Basic Usage
```javascript
// Process system reference IDs
const systemRefIds = ['ORDER001', 'ORDER002', 'ORDER003'];
await processUnifiedData(systemRefIds);

// Apply filters
updateFilters({
  dateRange: { start_date: '2024-01-01', end_date: '2024-01-31' },
  brand: 'AMAN MAJU NUSANTARA',
  marketplace: 'SHOPEE'
});

// Access unified data
const cardsData = getCardsData();
const chartsData = getChartsData();
const tableData = getTableData();
```

### Advanced Filtering
```javascript
// Complex filter combination
updateFilters({
  dateRange: { start_date: '2024-01-01', end_date: '2024-01-31' },
  brand: 'AMAN MAJU NUSANTARA',
  marketplace: 'SHOPEE',
  status: ['cancelled', 'unpaid'] // Exclude these statuses
});
```

## Migration Guide

### From Old System
1. **Replace API calls**: Update from `/query/monitoring` to `/query/monitoring-unified`
2. **Update components**: Replace individual card/chart components with unified versions
3. **Modify filters**: Use unified filter component instead of separate filter logic
4. **Update state management**: Use unified monitoring hook for centralized state

### Backward Compatibility
- Old endpoints remain functional during transition
- Gradual migration possible with feature flags
- Data format compatibility maintained

## Troubleshooting

### Common Issues
1. **Data mismatch**: Check filter consistency and SQL query logic
2. **Performance issues**: Verify database indexing and query optimization
3. **Filter not working**: Ensure proper filter parameter passing
4. **Chart not updating**: Check data validation and component re-rendering

### Debug Tools
- Browser developer tools for frontend debugging
- Database query logs for backend debugging
- Data consistency validation warnings in console
- Network tab for API request/response inspection

## Future Enhancements

### Planned Features
1. **Real-time updates**: WebSocket integration for live data
2. **Advanced analytics**: More sophisticated chart types and metrics
3. **Export options**: Excel, CSV, and PDF export functionality
4. **Custom dashboards**: User-configurable dashboard layouts
5. **Alert system**: Automated notifications for data anomalies

### Performance Optimizations
1. **Database indexing**: Optimize query performance with proper indexes
2. **Caching strategy**: Implement Redis caching for frequently accessed data
3. **Lazy loading**: Load chart data on demand
4. **Virtual scrolling**: Handle large datasets efficiently

## Conclusion

This unified monitoring solution provides a robust, consistent, and maintainable approach to order monitoring. By centralizing data logic and ensuring consistency across all components, it eliminates the data inconsistency issues while improving performance and user experience.

The solution is designed to be scalable, maintainable, and extensible for future enhancements while maintaining backward compatibility during the migration process.
