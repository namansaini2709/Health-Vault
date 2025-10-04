# HealthVault - One Patient, One Record

HealthVault is a cloud-based portable health record system that unifies a patient's medical data (prescriptions, reports, scans) across hospitals, clinics, and apps — accessible anywhere with just a QR code.

## Technology Stack

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Node.js (Backend)
- MongoDB Atlas (Database)
- Axios (API client)

All shadcn/ui components have been downloaded under `@/components/ui`.

## Features

1. Digital Health Locker
   - Patients upload prescriptions, lab results, and past records (PDFs/images)
   - Stored in a secure cloud vault

2. QR-Code Based Access
   - Each patient gets a unique health QR
   - Doctors can scan QR to instantly view history (with patient consent)

3. Smart Record Summarizer (AI)
   - AI auto-summarizes long prescriptions/reports into key insights
   - Example: "Patient has hypertension, on meds since 2019"

4. Multi-Platform Access
   - Simple mobile app or web dashboard
   - Works offline → syncs when internet available

## File Structure

- `index.html` - HTML entry point
- `vite.config.ts` - Vite configuration file
- `tailwind.config.js` - Tailwind CSS configuration file
- `package.json` - NPM dependencies and scripts
- `src/app.tsx` - Root component of the project
- `src/main.tsx` - Project entry point
- `src/index.css` - Existing CSS configuration
- `src/pages/Index.tsx` - Home page logic
- `/backend` - Node.js/Express server with MongoDB integration

## Components

- All shadcn/ui components are pre-downloaded and available at `@/components/ui`

## Backend Structure

The backend is located in the `/backend` directory and includes:

- `server.js` - Main Express server
- `package.json` - Backend dependencies
- `.env` - Environment variables
- `/uploads` - Directory for uploaded files

## Styling

- Add global styles to `src/index.css` or create new CSS files as needed
- Use Tailwind classes for styling components

## Development

- Import components from `@/components/ui` in your React components
- Customize the UI by modifying the Tailwind configuration

## Note

- The `@/` path alias points to the `src/` directory
- In your typescript code, don't re-export types that you're already importing

## Setup Instructions

### Frontend

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Create a `.env` file with your API base URL:
   ```
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

3. Start the development server:
   ```bash
   pnpm run dev
   ```

### Backend

1. Navigate to the `/backend` directory
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with your MongoDB Atlas connection string:
   ```
   MONGODB_URI=your_mongodb_atlas_connection_string_here
   ```
4. Start the backend server:
   ```bash
   npm run dev
   ```

For detailed MongoDB Atlas setup, see `MONGODB_SETUP.md`.

# Commands

**Install Dependencies**

```shell
pnpm i
```

**Start Frontend Preview**

```shell
pnpm run dev
```

**To build Frontend**

```shell
pnpm run build
```
