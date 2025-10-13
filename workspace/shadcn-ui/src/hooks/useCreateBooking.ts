import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

// Encryption function based on the snippet from gemini.md
async function encryptAppointment(plain, userKey) {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    userKey,
    enc.encode(JSON.stringify(plain))
  );
  return JSON.stringify({ iv: Array.from(iv), cipher: Buffer.from(cipher).toString('base64') });
}

const createBooking = async (bookingDetails) => {
    // In a real app, the userKey would be derived from the user's credentials or a KMS
    const userKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);

    const encrypted_details = await encryptAppointment(
        { start_ts: bookingDetails.start_ts, end_ts: bookingDetails.end_ts },
        userKey
    );

  const { data } = await axios.post('/api/v1/bookings', { 
      place_id: bookingDetails.place_id,
      encrypted_details 
    });
  return data;
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      // Invalidate and refetch the appointments query to show the new booking
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
};
