
const express = require('express');
const { Pool } = require('pg');
const redis = require('redis');
const axios = require('axios');

const app = express();
const port = 3001;
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// --- Database and Cache Setup ---

const pool = new Pool({
  user: 'user',
  host: 'localhost',
  database: 'healthvault',
  password: 'password',
  port: 5432,
});

const redisClient = redis.createClient({
    url: 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

(async () => {
    await redisClient.connect();
})();

const GEO_CACHE_TTL = 60 * 60 * 24; // 24 hours

app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

const cors = require('cors');
app.use(cors());

app.get('/', (req, res) => {
  res.send('HealthVault API is running!');
});

// --- API Endpoints ---

const requirePremium = require('./middleware/requirePremium');

// Doctors / Discovery
app.get('/v1/doctors/nearby', requirePremium, async (req, res) => {
  const { lat, lng, radius = 10000, specialization = '' } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'Latitude and longitude are required.' });
  }

  const cacheKey = `nearby:${lat}:${lng}:${radius}:${specialization}`;

  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const params = {
      location: `${lat},${lng}`,
      radius,
      keyword: specialization,
      type: 'doctor',
      key: process.env.GOOGLE_MAPS_API_KEY, // TODO: Set this environment variable
    };

    const googleRes = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', { params });

    const normalized = googleRes.data.results.map(r => ({
      place_id: r.place_id,
      name: r.name,
      location: r.geometry.location,
      rating: r.rating,
      open_now: r.opening_hours?.open_now || false,
      vicinity: r.vicinity
    }));

    await redisClient.set(cacheKey, JSON.stringify(normalized), { EX: GEO_CACHE_TTL });

    res.json(normalized);

  } catch (error) {
    console.error('Error fetching nearby doctors:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/v1/doctors/:place_id/details', requirePremium, async (req, res) => {
    const { place_id } = req.params;

    try {
        // First, check the database cache
        const { rows } = await pool.query('SELECT * FROM doctors_cache WHERE place_id = $1', [place_id]);
        
        if (rows.length > 0) {
            const doctor = rows[0];
            const oneDayAgo = new Date(new Date().setDate(new Date().getDate() - 1));

            // If data is fresh (less than a day old), return it
            if (doctor.last_fetched > oneDayAgo && doctor.raw_json) {
                return res.json(doctor.raw_json);
            }
        }

        // If not in cache or stale, fetch from Google Places API
        const params = {
            place_id,
            fields: 'name,formatted_address,formatted_phone_number,website,opening_hours,rating,reviews',
            key: process.env.GOOGLE_MAPS_API_KEY, // TODO: Set this environment variable
        };

        const googleRes = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', { params });
        const details = googleRes.data.result;

        // Update our database cache
        const query = `
            INSERT INTO doctors_cache (place_id, name, address, phone, website, raw_json, last_fetched)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            ON CONFLICT (place_id) DO UPDATE SET
                name = EXCLUDED.name,
                address = EXCLUDED.address,
                phone = EXCLUDED.phone,
                website = EXCLUDED.website,
                raw_json = EXCLUDED.raw_json,
                last_fetched = NOW();
        `;
        const values = [place_id, details.name, details.formatted_address, details.formatted_phone_number, details.website, details];
        await pool.query(query, values);

        res.json(details);

    } catch (error) {
        console.error(`Error fetching details for place_id ${place_id}:`, error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- Booking Endpoints ---

app.post('/api/v1/bookings', requirePremium, async (req, res) => {
    // In a real app, user ID would come from the authenticated session
    const user_id = req.user?.id || '123e4567-e89b-12d3-a456-426614174000'; // Example UUID
    const { place_id, encrypted_details } = req.body;

    if (!place_id || !encrypted_details) {
        return res.status(400).json({ error: 'place_id and encrypted_details are required.' });
    }

    try {
        const query = `
            INSERT INTO appointments (user_id, doctor_place_id, source, encrypted_details, status)
            VALUES ($1, $2, 'google_places', $3, 'booked')
            RETURNING id, status;
        `;
        const values = [user_id, place_id, encrypted_details];
        const { rows } = await pool.query(query, values);

        const newBooking = rows[0];

        res.status(201).json({
            booking_id: newBooking.id,
            status: newBooking.status
        });

    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/v1/bookings/:id', requirePremium, async (req, res) => {
    const { id } = req.params;
    const user_id = req.user?.id || '123e4567-e89b-12d3-a456-426614174000'; // Example UUID

    try {
        const query = 'SELECT * FROM appointments WHERE id = $1 AND user_id = $2';
        const { rows } = await pool.query(query, [id, user_id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Booking not found or you do not have permission to view it.' });
        }

        res.json(rows[0]);

    } catch (error) {
        console.error(`Error fetching booking ${id}:`, error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/v1/bookings/:id/cancel', requirePremium, async (req, res) => {
    const { id } = req.params;
    const user_id = req.user?.id || '123e4567-e89b-12d3-a456-426614174000'; // Example UUID

    try {
        const findQuery = 'SELECT * FROM appointments WHERE id = $1 AND user_id = $2';
        const { rows } = await pool.query(findQuery, [id, user_id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Booking not found or you do not have permission to cancel it.' });
        }

        // For now, we assume cancellation is always allowed.
        // In a real app, this would check the `source` and business logic.
        const updateQuery = 'UPDATE appointments SET status = \'cancelled\' WHERE id = $1 RETURNING *';
        const updatedResult = await pool.query(updateQuery, [id]);

        res.json(updatedResult.rows[0]);

    } catch (error) {
        console.error(`Error cancelling booking ${id}:`, error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- Entitlements & Quotas ---



// Temporary endpoint to set patient tier (for testing purposes)
app.put('/admin/patient/:id/tier', async (req, res) => {
  const { id } = req.params;
  const { tier: newTier } = req.body;

  // Validate tier
  if (!['free', 'premium'].includes(newTier)) {
    return res.status(400).json({ error: 'Invalid tier. Must be "free" or "premium".' });
  }

  try {
    // Update patient's tier
    const result = await pool.query(
      'UPDATE patients SET tier = $1 WHERE id = $2 RETURNING *',
      [newTier, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found.' });
    }

    res.json({ message: `Patient tier updated to ${newTier}`, patient: result.rows[0] });
  } catch (error) {
    console.error('Error updating patient tier:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to find patient by partial ID (for testing)
app.get('/admin/patient/search/:partialId', async (req, res) => {
  const { partialId } = req.params;

  try {
    // Look for a patient whose ID contains the partial ID
    const result = await pool.query(
      'SELECT id, name, email, tier FROM patients WHERE id::text LIKE $1',
      [`%${partialId}%`]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found.' });
    }
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error searching for patient:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Proper entitlements endpoint
app.get('/v1/entitlements', async (req, res) => {
  const user_id = req.user?.id;

  if (!user_id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get the user's tier from the patients table
    const result = await pool.query(
      'SELECT tier FROM patients WHERE id = $1',
      [user_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    
    const tier = result.rows[0].tier || 'free';
    
    res.json({
      user_id,
      tier,
      nearby_scans_remaining: tier === 'premium' ? 500 : 0, // Premium users get 500 scans, free users get 0
      scan_reset_at: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    });
  } catch (error) {
    console.error('Error fetching entitlements:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// TODO: Move this to an environment variable
const JWT_SECRET = 'your_jwt_secret';

app.post('/api/v1/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign({ id: user.id, user_type: user.user_type }, JWT_SECRET, { expiresIn: '1h' });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        user_type: user.user_type,
      },
      userType: user.user_type,
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/v1/patients', async (req, res) => {
  const { name, email, phone, dateOfBirth, emergencyContact, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const userResult = await client.query(
        'INSERT INTO users (email, password_hash, user_type) VALUES ($1, $2, $3) RETURNING *',
        [email, password_hash, 'patient']
      );
      const newUser = userResult.rows[0];

      const qr_code = `HV_${newUser.id}_${Date.now().toString(36)}`;

      const patientResult = await client.query(
        'INSERT INTO patients (id, name, phone, date_of_birth, emergency_contact, qr_code, tier) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [newUser.id, name, phone, dateOfBirth, emergencyContact, qr_code, 'free']  // Default to 'free' tier
      );
      const newPatient = patientResult.rows[0];

      await client.query('COMMIT');

      res.status(201).json({
        ...newUser,
        ...newPatient,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error registering patient:', error);
      if (error.constraint === 'users_email_key') {
        return res.status(409).json({ error: 'User with this email already exists.' });
      }
      res.status(500).json({ error: 'Internal Server Error' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error connecting to database:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/v1/doctors', async (req, res) => {
  const { name, email, specialty, license, password } = req.body;

  if (!name || !email || !password || !specialty || !license) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const userResult = await client.query(
        'INSERT INTO users (email, password_hash, user_type) VALUES ($1, $2, $3) RETURNING *',
        [email, password_hash, 'doctor']
      );
      const newUser = userResult.rows[0];

      const doctorResult = await client.query(
        'INSERT INTO doctors (id, name, specialty, license) VALUES ($1, $2, $3, $4) RETURNING *',
        [newUser.id, name, specialty, license]
      );
      const newDoctor = doctorResult.rows[0];

      await client.query('COMMIT');

      res.status(201).json({
        ...newUser,
        ...newDoctor,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error registering doctor:', error);
      if (error.constraint === 'users_email_key') {
        return res.status(409).json({ error: 'User with this email already exists.' });
      }
      res.status(500).json({ error: 'Internal Server Error' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error connecting to database:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/v1/patients', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT u.id, u.email, u.user_type, p.name, p.phone, p.date_of_birth, p.emergency_contact, p.profile_picture_url, p.qr_code FROM users u JOIN patients p ON u.id = p.id'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to get patients by query parameters (QR code or email)
app.get('/api/v1/patients', async (req, res) => {
  const { qrCode, email } = req.query;

  try {
    let query = 'SELECT u.id, u.email, u.user_type, p.name, p.phone, p.date_of_birth, p.emergency_contact, p.profile_picture_url, p.qr_code, p.tier FROM users u JOIN patients p ON u.id = p.id';
    let params = [];
    let isSingleResult = false;

    if (qrCode) {
      query += ' WHERE p.qr_code = $1';
      params.push(qrCode);
      isSingleResult = true;
    } else if (email) {
      query += ' WHERE u.email = $1';
      params.push(email);
      isSingleResult = true;
    }

    const { rows } = await pool.query(query, params);
    
    if (isSingleResult) {
      if (rows.length > 0) {
        // When looking up by QR code or email, return just the patient data
        res.json(rows[0]);
      } else {
        // If no patient found with the given qrCode or email
        return res.status(404).json({ error: 'Patient not found.' });
      }
    } else {
      // When getting all patients, return the array
      res.json(rows);
    }
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/v1/doctors', async (req, res) => {
  try {
    // Check for email query parameter
    const { email } = req.query;
    
    let query = 'SELECT u.id, u.email, u.user_type, d.name, d.specialty, d.license FROM users u JOIN doctors d ON u.id = d.id';
    let params = [];
    let isSingleResult = false;
    
    if (email) {
      query += ' WHERE u.email = $1';
      params.push(email);
      isSingleResult = true;
    }

    const { rows } = await pool.query(query, params);
    
    if (isSingleResult) {
      if (rows.length > 0) {
        res.json(rows[0]); // Return single doctor when found by email
      } else {
        return res.status(404).json({ error: 'Doctor not found.' });
      }
    } else {
      res.json(rows); // Return all doctors when no email filter
    }
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/v1/patients/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      'SELECT u.id, u.email, u.user_type, p.name, p.phone, p.date_of_birth, p.emergency_contact, p.profile_picture_url, p.qr_code, p.tier FROM users u JOIN patients p ON u.id = p.id WHERE u.id = $1',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found.' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/v1/doctors/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      'SELECT u.id, u.email, u.user_type, d.name, d.specialty, d.license FROM users u JOIN doctors d ON u.id = d.id WHERE u.id = $1',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Doctor not found.' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching doctor:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/v1/patients/:id', async (req, res) => {
  const { id } = req.params;
  const { name, phone, dateOfBirth, emergencyContact, profilePictureUrl, tier } = req.body;

  try {
    let query = 'UPDATE patients SET ';
    const values = [];
    let paramCount = 1;
    
    // Build dynamic query based on provided fields
    if (name) {
      query += `name = ${paramCount}, `;
      values.push(name);
      paramCount++;
    }
    if (phone) {
      query += `phone = ${paramCount}, `;
      values.push(phone);
      paramCount++;
    }
    if (dateOfBirth) {
      query += `date_of_birth = ${paramCount}, `;
      values.push(dateOfBirth);
      paramCount++;
    }
    if (emergencyContact) {
      query += `emergency_contact = ${paramCount}, `;
      values.push(emergencyContact);
      paramCount++;
    }
    if (profilePictureUrl) {
      query += `profile_picture_url = ${paramCount}, `;
      values.push(profilePictureUrl);
      paramCount++;
    }
    if (tier) {
      query += `tier = ${paramCount}, `;
      values.push(tier);
      paramCount++;
    }
    
    // Remove trailing comma and space, add WHERE clause
    query = query.slice(0, -2);
    query += ` WHERE id = ${paramCount} RETURNING *`;
    values.push(id);

    const { rows } = await pool.query(query, values);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found.' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/v1/upload-profile-picture', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// Medical Records endpoints
app.post('/medical-records', upload.single('file'), async (req, res) => {
  const { patientId, category, summary, encryptionKey, encryptionIV, originalFileName, originalFileType, pdfText } = req.body;

  if (!req.file || !patientId || !category) {
    return res.status(400).json({ error: 'File, patientId, and category are required.' });
  }

  try {
    // Store file info in database
    const recordResult = await pool.query(
      'INSERT INTO medical_records (patient_id, file_name, file_type, file_path, category, summary, encryption_key, encryption_iv, original_file_name, original_file_type, pdf_text) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
      [
        patientId, 
        req.file.filename, 
        req.file.mimetype, 
        req.file.path, 
        category, 
        summary || null,
        encryptionKey || null,
        encryptionIV ? JSON.parse(encryptionIV) : null,
        originalFileName || req.file.originalname,
        originalFileType || req.file.mimetype,
        pdfText || null
      ]
    );

    const newRecord = recordResult.rows[0];

    res.status(201).json({
      id: newRecord.id,
      patientId: newRecord.patient_id,
      fileName: newRecord.original_file_name,
      fileType: newRecord.original_file_type,
      fileUrl: newRecord.file_path,
      category: newRecord.category,
      uploadDate: newRecord.upload_date,
      summary: newRecord.summary,
      encryptionMetadata: newRecord.encryption_iv ? {
        originalName: newRecord.original_file_name,
        originalType: newRecord.original_file_type,
        iv: newRecord.encryption_iv
      } : undefined,
      aiSummary: newRecord.ai_summary || null
    });
  } catch (error) {
    console.error('Error uploading medical record:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/medical-records', async (req, res) => {
  const { patientId } = req.query;

  if (!patientId) {
    return res.status(400).json({ error: 'patientId query parameter is required.' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT * FROM medical_records WHERE patient_id = $1 ORDER BY upload_date DESC',
      [patientId]
    );

    // Transform the records to match the frontend interface
    const records = rows.map(row => ({
      id: row.id,
      patientId: row.patient_id,
      fileName: row.original_file_name,
      fileType: row.original_file_type,
      fileUrl: row.file_path,
      category: row.category,
      uploadDate: row.upload_date,
      summary: row.summary,
      encryptionMetadata: row.encryption_iv ? {
        originalName: row.original_file_name,
        originalType: row.original_file_type,
        iv: row.encryption_iv
      } : undefined,
      aiSummary: row.ai_summary || null
    }));

    res.json(records);
  } catch (error) {
    console.error('Error fetching medical records:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/api/medical-records/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const recordResult = await pool.query(
      'SELECT * FROM medical_records WHERE id = $1',
      [id]
    );

    if (recordResult.rows.length === 0) {
      return res.status(404).json({ error: 'Medical record not found.' });
    }

    // Delete the record
    await pool.query(
      'DELETE FROM medical_records WHERE id = $1',
      [id]
    );

    res.json({ message: 'Medical record deleted successfully.' });
  } catch (error) {
    console.error('Error deleting medical record:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Access Control Endpoints
const { v4: uuidv4 } = require('uuid');

// Create access requests table if it doesn't exist
// This would normally be in the db migration, but adding here for demo purposes
const initializeAccessRequestsTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS access_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        doctor_id UUID REFERENCES users(id) NOT NULL,
        patient_id UUID REFERENCES users(id) NOT NULL,
        requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'granted', 'denied', 'revoked')),
        responded_at TIMESTAMP WITH TIME ZONE,
        encryption_keys JSONB, -- Store encrypted keys for granted access
        UNIQUE(doctor_id, patient_id)
      )
    `);
    console.log('Access requests table created or already exists');
  } catch (err) {
    console.error('Error creating access requests table:', err);
  }
};

initializeAccessRequestsTable();

app.post('/api/access-requests', async (req, res) => {
  const { doctorId, patientQRCode } = req.body;

  if (!doctorId || !patientQRCode) {
    return res.status(400).json({ error: 'doctorId and patientQRCode are required.' });
  }

  try {
    // First, find the patient by QR code
    const patientResult = await pool.query(
      'SELECT u.id FROM users u JOIN patients p ON u.id = p.id WHERE p.qr_code = $1',
      [patientQRCode]
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found with the given QR code.' });
    }

    const patientId = patientResult.rows[0].id;

    // Check if a request already exists between this doctor and patient
    const existingRequest = await pool.query(
      'SELECT * FROM access_requests WHERE doctor_id = $1 AND patient_id = $2',
      [doctorId, patientId]
    );

    if (existingRequest.rows.length > 0) {
      // If there's an existing request, update its status back to pending if it was denied/revoked
      if (existingRequest.rows[0].status !== 'granted') {
        await pool.query(
          'UPDATE access_requests SET status = $1, requested_at = NOW(), responded_at = NULL, encryption_keys = NULL WHERE id = $2',
          ['pending', existingRequest.rows[0].id]
        );

        // Get the updated record
        const updatedResult = await pool.query(
          'SELECT ar.*, u.email as patient_email, u2.email as doctor_email, p.name as patient_name, p2.name as doctor_name ' +
          'FROM access_requests ar ' +
          'JOIN users u ON ar.patient_id = u.id ' +
          'JOIN users u2 ON ar.doctor_id = u2.id ' +
          'JOIN patients p ON u.id = p.id ' +
          'JOIN doctors p2 ON u2.id = p2.id ' +
          'WHERE ar.id = $1',
          [existingRequest.rows[0].id]
        );

        return res.json({
          _id: updatedResult.rows[0].id,
          doctorId: updatedResult.rows[0].doctor_id,
          patientId: updatedResult.rows[0].patient_id,
          patientName: updatedResult.rows[0].patient_name,
          patientEmail: updatedResult.rows[0].patient_email,
          patientQRCode: patientQRCode, // Return the QR code that was used
          doctorName: updatedResult.rows[0].doctor_name,
          doctorSpecialty: p2.specialty, // Note: This would need to be adjusted since p2 is from the JOIN
          requestedAt: updatedResult.rows[0].requested_at,
          status: updatedResult.rows[0].status,
          encryptionKeys: updatedResult.rows[0].encryption_keys || [],
          seenByDoctor: false // Default value
        });
      } else {
        return res.status(409).json({ error: 'Doctor already has access to this patient.' });
      }
    }

    // Create a new access request
    const newRequestResult = await pool.query(
      'INSERT INTO access_requests (doctor_id, patient_id) VALUES ($1, $2) RETURNING *',
      [doctorId, patientId]
    );

    // Get patient and doctor details to return
    const detailsResult = await pool.query(
      'SELECT ar.*, u.email as patient_email, u2.email as doctor_email, p.name as patient_name, p2.name as doctor_name, p2.specialty as doctor_specialty ' +
      'FROM access_requests ar ' +
      'JOIN users u ON ar.patient_id = u.id ' +
      'JOIN users u2 ON ar.doctor_id = u2.id ' +
      'JOIN patients p ON u.id = p.id ' +
      'JOIN doctors p2 ON u2.id = p2.id ' +
      'WHERE ar.id = $1',
      [newRequestResult.rows[0].id]
    );

    const row = detailsResult.rows[0];
    
    res.status(201).json({
      _id: row.id,
      doctorId: row.doctor_id,
      patientId: row.patient_id,
      patientName: row.patient_name,
      patientEmail: row.patient_email,
      patientQRCode: patientQRCode, // Return the QR code that was used
      doctorName: row.doctor_name,
      doctorSpecialty: row.specialty,
      requestedAt: row.requested_at,
      status: row.status,
      encryptionKeys: row.encryption_keys || [],
      seenByDoctor: false // Default value
    });
  } catch (error) {
    console.error('Error creating access request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/access-requests/doctor/:id/pending', async (req, res) => {
  const { id: doctorId } = req.params;

  try {
    const requests = await pool.query(
      'SELECT ar.*, u.email as patient_email, p.name as patient_name, p.qr_code as patient_qr_code ' +
      'FROM access_requests ar ' +
      'JOIN users u ON ar.patient_id = u.id ' +
      'JOIN patients p ON u.id = p.id ' +
      'WHERE ar.doctor_id = $1 AND ar.status = $2 ' +
      'ORDER BY ar.requested_at DESC',
      [doctorId, 'pending']
    );

    const formattedRequests = requests.rows.map(row => ({
      _id: row.id,
      doctorId: row.doctor_id,
      patientId: row.patient_id,
      patientName: row.patient_name,
      patientEmail: row.patient_email,
      patientQRCode: row.patient_qr_code,
      requestedAt: row.requested_at,
      status: row.status,
      doctorName: '', // Will be populated differently in a real implementation
      doctorSpecialty: '', // Will be populated differently in a real implementation
      encryptionKeys: row.encryption_keys || [],
      seenByDoctor: false // Default value
    }));

    res.json(formattedRequests);
  } catch (error) {
    console.error('Error fetching pending requests for doctor:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/access-requests/doctor/:id/granted', async (req, res) => {
  const { id: doctorId } = req.params;

  try {
    const requests = await pool.query(
      'SELECT ar.*, u.email as patient_email, p.name as patient_name, p.qr_code as patient_qr_code ' +
      'FROM access_requests ar ' +
      'JOIN users u ON ar.patient_id = u.id ' +
      'JOIN patients p ON u.id = p.id ' +
      'WHERE ar.doctor_id = $1 AND ar.status = $2 ' +
      'ORDER BY ar.requested_at DESC',
      [doctorId, 'granted']
    );

    const formattedRequests = requests.rows.map(row => ({
      _id: row.id,
      doctorId: row.doctor_id,
      patientId: row.patient_id,
      patientName: row.patient_name,
      patientEmail: row.patient_email,
      patientQRCode: row.patient_qr_code,
      requestedAt: row.requested_at,
      status: row.status,
      respondedAt: row.responded_at,
      doctorName: '', // Will be populated differently in a real implementation
      doctorSpecialty: '', // Will be populated differently in a real implementation
      encryptionKeys: row.encryption_keys || [],
      seenByDoctor: false // Default value
    }));

    res.json(formattedRequests);
  } catch (error) {
    console.error('Error fetching granted requests for doctor:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/access-requests/doctor/:id/history', async (req, res) => {
  const { id: doctorId } = req.params;

  try {
    const requests = await pool.query(
      'SELECT ar.*, u.email as patient_email, p.name as patient_name, p.qr_code as patient_qr_code ' +
      'FROM access_requests ar ' +
      'JOIN users u ON ar.patient_id = u.id ' +
      'JOIN patients p ON u.id = p.id ' +
      'WHERE ar.doctor_id = $1 AND ar.status IN ($2, $3, $4) ' +
      'ORDER BY ar.requested_at DESC',
      [doctorId, 'denied', 'revoked', 'granted']
    );

    const formattedRequests = requests.rows.map(row => ({
      _id: row.id,
      doctorId: row.doctor_id,
      patientId: row.patient_id,
      patientName: row.patient_name,
      patientEmail: row.patient_email,
      patientQRCode: row.patient_qr_code,
      requestedAt: row.requested_at,
      respondedAt: row.responded_at,
      status: row.status,
      doctorName: '', // Will be populated differently in a real implementation
      doctorSpecialty: '', // Will be populated differently in a real implementation
      encryptionKeys: row.encryption_keys || [],
      seenByDoctor: false // Default value
    }));

    res.json(formattedRequests);
  } catch (error) {
    console.error('Error fetching request history for doctor:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/access-requests/doctor/:id/unseen-count', async (req, res) => {
  const { id: doctorId } = req.params;

  try {
    // This would typically involve tracking seen status in the database
    res.json({ count: 0 }); // Placeholder
  } catch (error) {
    console.error('Error fetching unseen count for doctor:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/api/access-requests/:requestId/mark-seen', async (req, res) => {
  const { requestId } = req.params;

  try {
    // This would typically involve updating a seen status in the database
    // For now, just return a success response
    res.json({ status: 'success' });
  } catch (error) {
    console.error('Error marking request as seen:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/access-requests/patient/:id/pending', async (req, res) => {
  const { id: patientId } = req.params;

  try {
    const requests = await pool.query(
      'SELECT ar.*, u2.email as doctor_email, d.name as doctor_name, d.specialty as doctor_specialty ' +
      'FROM access_requests ar ' +
      'JOIN users u2 ON ar.doctor_id = u2.id ' +
      'JOIN doctors d ON u2.id = d.id ' +
      'WHERE ar.patient_id = $1 AND ar.status = $2 ' +
      'ORDER BY ar.requested_at DESC',
      [patientId, 'pending']
    );

    const formattedRequests = requests.rows.map(row => ({
      _id: row.id,
      doctorId: row.doctor_id,
      patientId: row.patient_id,
      patientName: '', // Will be populated differently in a real implementation
      patientEmail: '', // Will be populated differently in a real implementation
      patientQRCode: '', // Will be populated differently in a real implementation
      doctorName: row.doctor_name,
      doctorSpecialty: row.doctor_specialty,
      requestedAt: row.requested_at,
      status: row.status,
      doctorName: row.doctor_name,
      doctorSpecialty: row.doctor_specialty,
      encryptionKeys: row.encryption_keys || [],
      seenByDoctor: false // Default value
    }));

    res.json(formattedRequests);
  } catch (error) {
    console.error('Error fetching pending requests for patient:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/access-requests/patient/:id/granted', async (req, res) => {
  const { id: patientId } = req.params;

  try {
    const requests = await pool.query(
      'SELECT ar.*, u2.email as doctor_email, d.name as doctor_name, d.specialty as doctor_specialty ' +
      'FROM access_requests ar ' +
      'JOIN users u2 ON ar.doctor_id = u2.id ' +
      'JOIN doctors d ON u2.id = d.id ' +
      'WHERE ar.patient_id = $1 AND ar.status = $2 ' +
      'ORDER BY ar.requested_at DESC',
      [patientId, 'granted']
    );

    const formattedRequests = requests.rows.map(row => ({
      _id: row.id,
      doctorId: row.doctor_id,
      patientId: row.patient_id,
      patientName: '', // Will be populated differently in a real implementation
      patientEmail: '', // Will be populated differently in a real implementation
      patientQRCode: '', // Will be populated differently in a real implementation
      doctorName: row.doctor_name,
      doctorSpecialty: row.doctor_specialty,
      requestedAt: row.requested_at,
      respondedAt: row.responded_at,
      status: row.status,
      doctorName: row.doctor_name,
      doctorSpecialty: row.doctor_specialty,
      encryptionKeys: row.encryption_keys || [],
      seenByDoctor: false // Default value
    }));

    res.json(formattedRequests);
  } catch (error) {
    console.error('Error fetching granted permissions for patient:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/api/access-requests/:requestId/grant', async (req, res) => {
  const { requestId } = req.params;
  const { encryptionKeys } = req.body;

  try {
    // Update the request status to granted and add encryption keys
    const result = await pool.query(
      'UPDATE access_requests SET status = $1, responded_at = NOW(), encryption_keys = $2 WHERE id = $3 RETURNING *',
      ['granted', JSON.stringify(encryptionKeys), requestId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found.' });
    }

    res.json({ message: 'Access granted successfully.' });
  } catch (error) {
    console.error('Error granting access:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/api/access-requests/:requestId/deny', async (req, res) => {
  const { requestId } = req.params;

  try {
    const result = await pool.query(
      'UPDATE access_requests SET status = $1, responded_at = NOW() WHERE id = $2 RETURNING *',
      ['denied', requestId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found.' });
    }

    res.json({ message: 'Access denied successfully.' });
  } catch (error) {
    console.error('Error denying access:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/api/access-requests/:requestId/revoke', async (req, res) => {
  const { requestId } = req.params;

  try {
    const result = await pool.query(
      'UPDATE access_requests SET status = $1, responded_at = NOW() WHERE id = $2 RETURNING *',
      ['revoked', requestId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found.' });
    }

    res.json({ message: 'Access revoked successfully.' });
  } catch (error) {
    console.error('Error revoking access:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/access-requests/check/:doctorId/:patientId', async (req, res) => {
  const { doctorId, patientId } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM access_requests WHERE doctor_id = $1 AND patient_id = $2',
      [doctorId, patientId]
    );

    if (result.rows.length === 0) {
      return res.json({ hasAccess: false, request: null });
    }

    const request = result.rows[0];
    const hasAccess = request.status === 'granted';

    res.json({ hasAccess, request: hasAccess ? request : null });
  } catch (error) {
    console.error('Error checking access:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/access-requests/doctor/:doctorId/patient/:patientId/keys/:recordId', async (req, res) => {
  const { doctorId, patientId, recordId } = req.params;

  try {
    // Check if the doctor has access to the patient
    const accessCheck = await pool.query(
      'SELECT encryption_keys FROM access_requests WHERE doctor_id = $1 AND patient_id = $2 AND status = $3',
      [doctorId, patientId, 'granted']
    );

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Doctor does not have access to this patient.' });
    }

    const encryptionKeys = accessCheck.rows[0].encryption_keys ? JSON.parse(accessCheck.rows[0].encryption_keys) : [];
    const key = encryptionKeys.find(k => k.recordId === recordId);

    if (!key) {
      return res.status(404).json({ error: 'Decryption key not found for this record.' });
    }

    res.json(key);
  } catch (error) {
    console.error('Error fetching decryption key:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// AI Summarization endpoints
app.post('/api/summarize-record/:recordId', async (req, res) => {
  const { recordId } = req.params;
  
  // This would integrate with an AI service to generate summaries
  // For now, returning a placeholder response
  
  try {
    // TODO: Implement actual AI summarization logic
    // This would typically involve:
    // 1. Fetch the record from storage
    // 2. Extract text from the document (if PDF/image)
    // 3. Send to an AI service (e.g. OpenAI, HuggingFace)
    // 4. Store the generated summary
    
    console.log(`Summarization requested for record ID: ${recordId}`);
    
    res.json({ 
      recordId,
      status: 'processing',
      message: 'Record summarization in progress' 
    });
  } catch (error) {
    console.error('Error summarizing record:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/summarize-patient/:patientId', async (req, res) => {
  const { patientId } = req.params;
  const { force = false } = req.query;
  
  // This would generate summaries for all records of a patient
  // For now, returning a placeholder response
  
  try {
    // TODO: Implement actual AI summarization logic for all patient records
    console.log(`Patient summarization requested for patient ID: ${patientId}, force: ${force}`);
    
    res.json({ 
      patientId,
      status: 'processing',
      message: 'Patient record summarization in progress' 
    });
  } catch (error) {
    console.error('Error summarizing patient:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
