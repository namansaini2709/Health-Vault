console.log('Script started...');
const axios = require('axios');

async function updateUserTier() {
  try {
    console.log('Fetching patients...');
    const response = await axios.get('http://localhost:5001/api/patients');
    const patients = response.data;
    console.log(`Found ${patients.length} patients.`);
    const targetPatient = patients.find(p => p.id.endsWith('9bc6392d'));

    if (targetPatient) {
      console.log(`Found patient: ${targetPatient.name} with ID ${targetPatient.id}`);
      console.log(`Updating tier to premium...`);

      const updateResponse = await axios.put(`http://localhost:5001/api/patients/${targetPatient.id}/tier`, { tier: 'premium' });
      
      console.log('Patient updated successfully:');
      console.log(updateResponse.data);
    } else {
      console.log('Patient with partial ID 9bc6392d not found.');
    }
  } catch (error) {
    console.error('An error occurred:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

console.log('Calling updateUserTier function...');
updateUserTier();
console.log('Script finished.');