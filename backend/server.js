
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
app.get('/api/v1/doctors/nearby', requirePremium, async (req, res) => {
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

app.get('/api/v1/doctors/:place_id/details', requirePremium, async (req, res) => {
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

app.get('/api/v1/entitlements', async (req, res) => {
    // In a real app, this would fetch the user's actual entitlements from the database.
    // For now, we'll return a hardcoded premium user.
    const user_id = req.user?.id || '123e4567-e89b-12d3-a456-426614174000'; // Example UUID

    res.json({
        user_id,
        tier: 'premium',
        nearby_scans_remaining: 499,
        scan_reset_at: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    });
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
        'INSERT INTO patients (id, name, phone, date_of_birth, emergency_contact, qr_code) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [newUser.id, name, phone, dateOfBirth, emergencyContact, qr_code]
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

app.post('/api/v1/doctors', async (req, res) => {
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

app.get('/api/v1/doctors', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT u.id, u.email, u.user_type, d.name, d.specialty, d.license FROM users u JOIN doctors d ON u.id = d.id'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/v1/patients/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      'SELECT u.id, u.email, u.user_type, p.name, p.phone, p.date_of_birth, p.emergency_contact, p.profile_picture_url, p.qr_code FROM users u JOIN patients p ON u.id = p.id WHERE u.id = $1',
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

app.get('/api/v1/doctors/:id', async (req, res) => {
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

app.put('/api/v1/patients/:id', async (req, res) => {
  const { id } = req.params;
  const { name, phone, dateOfBirth, emergencyContact, profilePictureUrl } = req.body;

  try {
    const { rows } = await pool.query(
      'UPDATE patients SET name = $1, phone = $2, date_of_birth = $3, emergency_contact = $4, profile_picture_url = $5 WHERE id = $6 RETURNING *',
      [name, phone, dateOfBirth, emergencyContact, profilePictureUrl, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found.' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/v1/upload-profile-picture', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
