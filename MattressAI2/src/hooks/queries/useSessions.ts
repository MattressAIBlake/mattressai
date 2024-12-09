import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionsApi } from '../../services/api/sessions';
import { useToastStore } from '../../stores/toastStore';

export const useSessions = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  verified?: boolean;
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: ['sessions', params],
    queryFn: () => sessionsApi.getSessions(params),
  });
};

export const useSession = (id: string) => {
  return useQuery({
    queryKey: ['session', id],
    queryFn: () => sessionsApi.getSession(id),
  });
};

export const useUpdateSession = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      sessionsApi.updateSession(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      addToast('success', 'Session updated successfully');
    },
    onError: () => {
      addToast('error', 'Failed to update session');
    },
  });
};

export const useDeleteSession = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: sessionsApi.deleteSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      addToast('success', 'Session deleted successfully');
    },
    onError: () => {
      addToast('error', 'Failed to delete session');
    },
  });
};