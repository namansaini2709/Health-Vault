CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE doctors_cache (
  id SERIAL PRIMARY KEY,
  place_id TEXT UNIQUE NOT NULL,          -- Google Place ID or internal id
  name TEXT NOT NULL,
  types TEXT[],                           -- e.g., ['doctor','hospital']
  specializations TEXT[],                 -- ['cardiologist','general practitioner']
  phone TEXT,
  website TEXT,
  address TEXT,
  location GEOGRAPHY(POINT, 4326),        -- longitude/latitude
  raw_json JSONB,                         -- original API payload
  last_fetched TIMESTAMP WITH TIME ZONE,
  verified BOOLEAN DEFAULT false
);

CREATE INDEX ON doctors_cache USING GIST (location);

CREATE TABLE doctor_availability (
  id SERIAL PRIMARY KEY,
  doctor_id INT REFERENCES doctors_cache(id) ON DELETE CASCADE,
  start_ts TIMESTAMP WITH TIME ZONE,
  end_ts TIMESTAMP WITH TIME ZONE,
  slot_length INT DEFAULT 30, -- minutes
  metadata JSONB
);

CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  user_id UUID,
  doctor_place_id TEXT,               -- link to doctors_cache.place_id
  source TEXT,                        -- 'google_places' | 'practo' | 'healthvault_internal'
  external_booking_reference TEXT,
  encrypted_details TEXT,             -- Encrypted blob of appointment details (start_ts, end_ts, etc.)
  status TEXT,                        -- 'booked','cancelled','completed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID,
  action TEXT,
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('patient', 'doctor')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE patients (
  id UUID PRIMARY KEY REFERENCES users(id),
  name TEXT NOT NULL,
  phone TEXT,
  date_of_birth DATE,
  emergency_contact TEXT,
  profile_picture_url TEXT,
  qr_code TEXT,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'premium'))
);

CREATE TABLE doctors (
  id UUID PRIMARY KEY REFERENCES users(id),
  name TEXT NOT NULL,
  specialty TEXT,
  license TEXT
);

-- Medical records table
CREATE TABLE medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES users(id) NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_path TEXT NOT NULL,
  category TEXT CHECK (category IN ('prescription', 'lab-result', 'scan', 'report', 'other')),
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  summary TEXT,
  encryption_key TEXT,        -- Encrypted encryption key stored on backend
  encryption_iv JSONB,        -- IV and other encryption metadata
  original_file_name TEXT,    -- Original name before encryption
  original_file_type TEXT,    -- Original file type
  pdf_text TEXT,              -- Extracted text from PDFs for AI analysis
  ai_summary JSONB            -- JSON containing AI-generated summary
);
