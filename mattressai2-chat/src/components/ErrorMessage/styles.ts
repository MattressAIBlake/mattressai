import styled from '@emotion/styled';
import { Theme } from '../../styles/theme';

export const ErrorContainer = styled.div<{ theme: Theme }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
  margin: ${({ theme }) => theme.spacing.sm} 0;
  background-color: #FEE2E2;
  border: 1px solid #FCA5A5;
  border-radius: 0.5rem;
  color: #DC2626;
`;

export const RetryButton = styled.button<{ theme: Theme }>`
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  background-color: #DC2626;
  color: white;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.875rem;
  
  &:hover {
    background-color: #B91C1C;
  }
  
  &:disabled {
    background-color: #FCA5A5;
    cursor: not-allowed;
  }
`; 