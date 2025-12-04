# Lead Distribution System

## Setup Instructions

### 1. Database Setup (Supabase)
This project uses Supabase. You need to create the tables manually because the "Anon Key" does not have permission to create tables.

1.  Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2.  Open your project (`djecmzrvrqrhcvvzdgfr`).
3.  Go to the **SQL Editor** (icon on the left).
4.  Copy the content of the `schema.sql` file in this project.
5.  Paste it into the SQL Editor and click **Run**.

### 2. Environment Variables
The `.env.local` file has been pre-filled with your project URL and Anon Key.

### 3. Run Locally
```bash
npm run dev
```

### 4. Deploy to GitHub
To push this code to your repository:
```bash
git push -u origin main
```
