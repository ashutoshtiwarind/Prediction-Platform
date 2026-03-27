# Prediction-Platform

```bash
cd ipl-prediction-2026

# 1. Install deps (need Node.js installed on your machine)
npm install

# 2. Copy env template and fill in your Supabase credentials
cp .env.local.example .env.local

# 3. Run the DB migration in Supabase SQL Editor
# (paste supabase/migrations/001_initial_schema.sql)

# 4. Enable Phone Auth in Supabase → Auth → Providers → Phone

# 5. Start dev server
npm run dev
```
