import { Card, Text, InlineStack, BlockStack, Icon } from '@shopify/polaris';
import { ArrowUpIcon, ArrowDownIcon } from '@shopify/polaris-icons';

/**
 * MetricCard Component
 * Displays a key metric with value and percentage change from previous period
 */
const MetricCard = ({ label, value, changePercent, isPositive }) => {
  const hasChange = changePercent !== null && changePercent !== undefined;
  
  // Determine color based on whether positive change is good
  // For conversion metrics, positive is good. Can be customized per metric.
  const changeColor = isPositive ? 'success' : 'critical';
  
  // Format the change percentage
  const formattedChange = hasChange 
    ? `${Math.abs(changePercent)}%` 
    : '—';

  return (
    <Card>
      <div style={{ padding: '20px', minWidth: '200px' }}>
        <BlockStack gap="200">
          <Text variant="bodyMd" as="p" tone="subdued">
            {label}
          </Text>
          
          <InlineStack align="space-between" blockAlign="center">
            <Text variant="heading2xl" as="h3">
              {value}
            </Text>
            
            {hasChange && (
              <InlineStack gap="100" blockAlign="center">
                <Icon
                  source={isPositive ? ArrowUpIcon : ArrowDownIcon}
                  tone={changeColor}
                />
                <Text 
                  variant="bodyMd" 
                  as="p" 
                  tone={changeColor}
                  fontWeight="semibold"
                >
                  {formattedChange}
                </Text>
              </InlineStack>
            )}
          </InlineStack>
        </BlockStack>
      </div>
    </Card>
  );
};

export default MetricCard;

