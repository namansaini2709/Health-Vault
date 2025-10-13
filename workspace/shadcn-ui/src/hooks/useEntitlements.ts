import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const fetchEntitlements = async () => {
  const { data } = await axios.get('/api/v1/entitlements');
  return data;
};

export const useEntitlements = () => {
  return useQuery({
    queryKey: ['entitlements'],
    queryFn: fetchEntitlements,
  });
};
