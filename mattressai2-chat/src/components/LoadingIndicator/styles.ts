import styled from '@emotion/styled';
import { Theme } from '../../styles/theme';
import { keyframes } from '@emotion/react';

const bounce = keyframes`
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1.0);
  }
`;

export const LoadingContainer = styled.div<{ theme: Theme }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.text};
  opacity: 0.7;
`;

export const Dot = styled.div<{ delay: number; theme: Theme }>`
  width: 8px;
  height: 8px;
  background-color: ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  display: inline-block;
  animation: ${bounce} 1.4s infinite ease-in-out;
  animation-delay: ${({ delay }) => delay}s;
`;

export const LoadingText = styled.span<{ theme: Theme }>`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text};
  margin-left: ${({ theme }) => theme.spacing.sm};
`; 