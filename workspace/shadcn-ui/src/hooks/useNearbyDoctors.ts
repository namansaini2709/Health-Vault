import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const fetchNearbyDoctors = async (lat, lng, radius) => {
  const { data } = await axios.get('/api/v1/doctors/nearby', {
    params: { lat, lng, radius },
  });
  return data;
};

export const useNearbyDoctors = (lat, lng, radius) => {
  return useQuery({
    queryKey: ['nearbyDoctors', lat, lng, radius],
    queryFn: () => fetchNearbyDoctors(lat, lng, radius),
    enabled: !!lat && !!lng, // Only run the query if lat and lng are available
  });
};
