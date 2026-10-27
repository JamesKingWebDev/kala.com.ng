# Database Update Required

## Update Agents Table Schema

Run this SQL in your Supabase SQL Editor to add the email field and update constraints:

```sql
-- Add email column to agents table
ALTER TABLE agents ADD COLUMN IF NOT EXISTS email TEXT;

-- Create unique index on email
CREATE UNIQUE INDEX IF NOT EXISTS agents_email_unique ON agents(email);

-- Update existing agents with email (if any exist)
-- This is optional - new agents will have email automatically

-- Update RLS policies to allow public access for reading active agents
DROP POLICY IF EXISTS "Public can view active agents" ON agents;

CREATE POLICY "Public can view active agents" ON agents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM payments
      WHERE payments.agent_id = agents.id
        AND payments.status = 'completed'
        AND payments.expires_at > NOW()
    )
  );

-- Allow anyone to insert agents (no auth required)
DROP POLICY IF EXISTS "Agents can insert own profile" ON agents;

CREATE POLICY "Anyone can insert agents" ON agents
  FOR INSERT WITH CHECK (true);

-- Allow agents to update their own profile by email
DROP POLICY IF EXISTS "Agents can update own profile" ON agents;

CREATE POLICY "Agents can update own profile by email" ON agents
  FOR UPDATE USING (email IS NOT NULL);

-- Update user_id to be nullable (since we don't use auth anymore)
ALTER TABLE agents ALTER COLUMN user_id DROP NOT NULL;
```

## Admin WhatsApp Configuration

Update the admin WhatsApp number in the backend:

1. Open `/workspaces/default/code/supabase/functions/server/index.tsx`
2. Find the line: `const ADMIN_WHATSAPP = "+2348012345678";`
3. Replace with your actual admin WhatsApp number in international format

Example: `const ADMIN_WHATSAPP = "+2348012345678";`

## How the New System Works

### For Agents:
1. Visit `/dashboard`
2. Enter their email address (no password needed)
3. Fill out their profile (business name, location, services, WhatsApp)
4. Click "Contact Admin to Activate"
5. WhatsApp opens with pre-filled message to admin
6. Admin provides bank account details via WhatsApp
7. Agent makes payment and confirms to admin
8. Admin activates the agent from the admin panel
9. Agent's profile becomes visible on the landing page for 24 hours

### For Admin:
1. Visit `/admin`
2. See all registered agents
3. When agent contacts you via WhatsApp:
   - Provide your bank account details
   - Wait for payment confirmation (screenshot/receipt)
   - Click "Activate" button next to the agent in admin panel
   - Enter duration (default 24 hours)
   - Agent becomes visible on the platform

### For Users:
1. Visit the landing page
2. Search for agents by location/service
3. See only active agents (paid within last 24 hours)
4. Click "Chat on WhatsApp" to contact agent directly

## Key Changes from Previous Version

- ❌ Removed authentication system (no login/signup)
- ✅ Email-based identification for agents
- ✅ Manual payment via WhatsApp coordination
- ✅ Admin manually activates agents after payment confirmation
- ✅ No Paystack integration needed
- ✅ Public access to all pages (no auth required)
