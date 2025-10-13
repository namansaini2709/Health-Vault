import React from 'react';
import BookingModal from './BookingModal';

const DoctorCard = ({ doctor }) => {
  return (
    <div className="doctor-card">
      <h3>{doctor.name}</h3>
      <p>{doctor.vicinity}</p>
      <p>Rating: {doctor.rating}</p>
      <BookingModal doctor={doctor} />
    </div>
  );
};

export default DoctorCard;
