import { useState } from 'react';
import { Card, BlockStack, Select, Text } from '@shopify/polaris';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

/**
 * TimeSeriesChart Component
 * Displays time series data with metric selection and period comparison
 */
const TimeSeriesChart = ({ data, currentPeriodLabel, previousPeriodLabel }) => {
  const [selectedMetric, setSelectedMetric] = useState('sessions');

  const metricOptions = [
    { label: 'Sessions', value: 'sessions' },
    { label: 'Leads Generated', value: 'leads' },
    { label: 'Orders', value: 'orders' },
    { label: 'Total Sales', value: 'sales' },
    { label: 'Conversion Rate', value: 'conversionRate' }
  ];

  const handleMetricChange = (value) => {
    setSelectedMetric(value);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Format Y-axis based on metric type
  const formatYAxis = (value) => {
    if (selectedMetric === 'conversionRate') {
      return `${value}%`;
    }
    if (selectedMetric === 'sales') {
      return `$${value}`;
    }
    return value;
  };

  // Format tooltip value
  const formatTooltipValue = (value) => {
    if (selectedMetric === 'conversionRate') {
      return `${value}%`;
    }
    if (selectedMetric === 'sales') {
      return `$${value.toFixed(2)}`;
    }
    return value;
  };

  // Prepare chart data
  const chartData = data.map(item => ({
    date: formatDate(item.date),
    current: item.current[selectedMetric] || 0,
    previous: item.previous[selectedMetric] || 0
  }));

  return (
    <Card>
      <div style={{ padding: '20px' }}>
        <BlockStack gap="400">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="headingMd" as="h2" fontWeight="semibold">
              Analytics Overview
            </Text>
            <div style={{ width: '200px' }}>
              <Select
                label="Metric"
                labelHidden
                options={metricOptions}
                value={selectedMetric}
                onChange={handleMetricChange}
              />
            </div>
          </div>

          <div style={{ width: '100%', height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E1E3E5" />
                <XAxis 
                  dataKey="date" 
                  stroke="#8C9196"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#8C9196"
                  style={{ fontSize: '12px' }}
                  tickFormatter={formatYAxis}
                />
                <Tooltip 
                  formatter={formatTooltipValue}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E1E3E5',
                    borderRadius: '8px',
                    padding: '8px 12px'
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="line"
                />
                <Line
                  type="monotone"
                  dataKey="current"
                  name={currentPeriodLabel}
                  stroke="#5C6AC4"
                  strokeWidth={2}
                  dot={{ fill: '#5C6AC4', r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="previous"
                  name={previousPeriodLabel}
                  stroke="#B4B9C1"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#B4B9C1', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </BlockStack>
      </div>
    </Card>
  );
};

export default TimeSeriesChart;

