import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../../services/api/settings';
import { useToastStore } from '../../stores/toastStore';

export const useAssistantSettings = () => {
  return useQuery({
    queryKey: ['settings', 'assistant'],
    queryFn: settingsApi.getAssistantSettings,
  });
};

export const useUpdateAssistantSettings = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: settingsApi.updateAssistantSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'assistant'] });
      addToast('success', 'Assistant settings updated successfully');
    },
    onError: () => {
      addToast('error', 'Failed to update assistant settings');
    },
  });
};

export const useContactDetails = () => {
  return useQuery({
    queryKey: ['settings', 'contact'],
    queryFn: settingsApi.getContactDetails,
  });
};

export const useUpdateContactDetails = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: settingsApi.updateContactDetails,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'contact'] });
      addToast('success', 'Contact details updated successfully');
    },
    onError: () => {
      addToast('error', 'Failed to update contact details');
    },
  });
};

export const useAssistantQuestions = () => {
  return useQuery({
    queryKey: ['settings', 'questions'],
    queryFn: settingsApi.getAssistantQuestions,
  });
};

export const useUpdateAssistantQuestions = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: settingsApi.updateAssistantQuestions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'questions'] });
      addToast('success', 'Assistant questions updated successfully');
    },
    onError: () => {
      addToast('error', 'Failed to update assistant questions');
    },
  });
};