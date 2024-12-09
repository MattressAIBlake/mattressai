import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { brandsApi } from '../../services/api/brands';
import { useToastStore } from '../../stores/toastStore';

export const useBrands = () => {
  return useQuery({
    queryKey: ['brands'],
    queryFn: brandsApi.getBrands,
  });
};

export const useUpdateBrand = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      brandsApi.updateBrand(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      addToast('success', 'Brand updated successfully');
    },
    onError: () => {
      addToast('error', 'Failed to update brand');
    },
  });
};

export const useSyncBrands = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: brandsApi.syncBrands,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      addToast('success', 'Brands synced successfully');
    },
    onError: () => {
      addToast('error', 'Failed to sync brands');
    },
  });
};