import React from 'react';
import { useCreateBooking } from '../../hooks/useCreateBooking';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const BookingModal = ({ doctor }) => {
  const createBookingMutation = useCreateBooking();

  const handleBooking = () => {
    // For demonstration, we'll use placeholder timestamps
    const bookingDetails = {
      place_id: doctor.place_id,
      start_ts: new Date().toISOString(),
      end_ts: new Date(new Date().getTime() + 60 * 60 * 1000).toISOString(), // 1 hour later
    };
    createBookingMutation.mutate(bookingDetails);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="book-button">Book Appointment</button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Booking</DialogTitle>
        </DialogHeader>
        <div className="booking-details">
          <p>You are booking an appointment with:</p>
          <h4>{doctor.name}</h4>
          <p>{doctor.vicinity}</p>
        </div>
        <button onClick={handleBooking} disabled={createBookingMutation.isLoading}>
          {createBookingMutation.isLoading ? 'Booking...' : 'Confirm Booking'}
        </button>
        {createBookingMutation.isError && (
          <p className="error">Error: {createBookingMutation.error.message}</p>
        )}
        {createBookingMutation.isSuccess && (
          <p className="success">Booking confirmed!</p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;
