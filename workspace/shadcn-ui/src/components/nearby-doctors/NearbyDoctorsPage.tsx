import React from 'react';
import NearbyMap from './NearbyMap';
import DoctorList from './DoctorList';
import { useEntitlements } from '../../hooks/useEntitlements';
import { useNearbyDoctors } from '../../hooks/useNearbyDoctors';

const NearbyDoctorsPage = () => {
  const { data: entitlements, error: entitlementsError, isLoading: entitlementsLoading } = useEntitlements();

  // Placeholder coordinates (e.g., San Francisco)
  const lat = 37.7749;
  const lng = -122.4194;
  const radius = 10000;

  const { data: doctors, error: doctorsError, isLoading: doctorsLoading } = useNearbyDoctors(lat, lng, radius);

  if (entitlementsLoading) return <p>Loading entitlements...</p>;
  if (entitlementsError) return <p>Error fetching entitlements: {entitlementsError.message}</p>;

  const isPremium = entitlements?.tier === 'premium';

  if (!isPremium) {
    return (
      <div className="locked-feature-card">
        <h2>Nearby Doctors - Premium Feature</h2>
        <p>Upgrade to a premium account to unlock this feature.</p>
        <button>Upgrade Now</button>
      </div>
    );
  }

  return (
    <div className="nearby-doctors-page">
      <h1>Find Nearby Doctors</h1>
      <div className="main-content">
        <div className="map-section">
            <NearbyMap doctors={doctors} lat={lat} lng={lng} />
        </div>
        <div className="list-section">
            <DoctorList doctors={doctors} isLoading={doctorsLoading} error={doctorsError} />
        </div>
      </div>
    </div>
  );
};

export default NearbyDoctorsPage;
