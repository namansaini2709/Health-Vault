import React from 'react';
import DoctorCard from './DoctorCard';

const DoctorList = ({ doctors, isLoading, error }) => {
  if (isLoading) return <p>Loading nearby doctors...</p>;
  if (error) return <p>Error fetching doctors: {error.message}</p>;

  return (
    <div className="doctor-list">
      {doctors && doctors.length > 0 ? (
        doctors.map(doctor => <DoctorCard key={doctor.place_id} doctor={doctor} />)
      ) : (
        <p>No doctors found nearby.</p>
      )}
    </div>
  );
};

export default DoctorList;
