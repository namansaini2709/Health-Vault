# HealthVault - MongoDB Atlas Setup Guide

## Connecting HealthVault to MongoDB Atlas

This guide explains how to set up MongoDB Atlas as the backend for HealthVault.

### Step 1: Create a MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas/database)
2. Sign up for a free account (or log in if you already have one)
3. Create a new project (or use an existing one)

### Step 2: Set Up a Cluster

1. In your project, click "Build a Database"
2. Choose the "Shared" option (free tier) 
3. Select a cloud provider and region close to your users
4. Choose the cluster tier (M0 for free tier)
5. Set your cluster name
6. Click "Create Cluster"

### Step 3: Create a Database User

1. Navigate to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication method
4. Set a username and password (remember these for the .env file)
5. Set the user privileges (for development, you can give "Atlas Admin" privileges)
6. Click "Add User"

### Step 4: Configure IP Access List

1. Navigate to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. For development, you can add "0.0.0.0/0" to allow access from anywhere (not recommended for production)
4. Click "Confirm"

### Step 5: Get Connection String

1. Go to "Database" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select "Node.js" as the driver
5. Copy the connection string

### Step 6: Configure Backend Environment

1. In the `backend/.env` file, update the `MONGODB_URI`:
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/healthvault?retryWrites=true&w=majority
   ```
   
   Replace:
   - `<username>` with your database user username
   - `<password>` with your database user password
   - `<cluster-name>` with your cluster name

⚠️ **IMPORTANT**: The `.env` file in the repository contains a placeholder value that will not work. You must replace it with your actual MongoDB Atlas connection string for the application to connect to the database.

### Step 7: Run the Backend Server

1. Navigate to the backend directory
2. Install dependencies: `npm install`
3. Start the server: `npm run dev`

### Step 8: Run the Frontend

1. In a separate terminal, navigate to the frontend directory: `/workspace/shadcn-ui`
2. Install dependencies if needed: `npm install`
3. Start the development server: `npm run dev`

The HealthVault application should now be connected to your MongoDB Atlas database!

## Notes

- The M0 (free) tier has limitations on storage and operations
- For production use, consider upgrading to a higher tier
- Remember to remove the "0.0.0.0/0" IP access for production and only allow specific IPs
- Always keep your database credentials secure