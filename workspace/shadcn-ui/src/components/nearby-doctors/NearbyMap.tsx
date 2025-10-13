import React from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const NearbyMap = ({ doctors, lat, lng }) => {
  const mapCenter = {
    lat: lat,
    lng: lng
  };

  return (
    <LoadScript
      googleMapsApiKey="YOUR_GOOGLE_MAPS_API_KEY" // TODO: Replace with your actual API key
    >
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={12}
      >
        {doctors && doctors.map(doctor => (
          <Marker
            key={doctor.place_id}
            position={doctor.location}
          />
        ))}
      </GoogleMap>
    </LoadScript>
  );
};

export default NearbyMap;
