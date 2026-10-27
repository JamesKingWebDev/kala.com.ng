# Logistics Connect Platform

A modern, full-stack logistics marketplace platform that connects users with verified logistics agents based on location and services offered.

## 🎯 Overview

This platform allows logistics agents to register and get discovered by customers in their area through a 24-hour visibility system. Payment is handled manually via WhatsApp coordination with the admin.

## 🚀 Features

### For Users
- 🔍 **Location-based Search** - Find agents by city, state, and service type
- 📍 **Real-time Availability** - See only active agents (paid within 24 hours)
- 💬 **Direct WhatsApp Contact** - One-click WhatsApp messaging to agents
- 📱 **Responsive Design** - Works on all devices

### For Agents
- 📝 **Simple Registration** - No complex signup, just enter email
- 🏢 **Profile Management** - Business name, location, services, WhatsApp
- ⏰ **24-Hour Visibility** - Pay to be visible for 24 hours
- 📊 **Activation History** - Track all your activations
- 💬 **WhatsApp Coordination** - Direct contact with admin for payments

### For Admin
- 👥 **Agent Management** - View all registered agents
- ✅ **Manual Activation** - Activate agents after payment confirmation
- 🔍 **Verification System** - Mark agents as verified
- 📊 **Activity Dashboard** - See active/inactive agents
- 📞 **WhatsApp Integration** - Agents contact you directly for activation

## 🛠️ Tech Stack

### Frontend
- **React** with TypeScript
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Lucide React** for icons

### Backend
- **Supabase** (PostgreSQL database)
- **Hono** edge functions
- **Deno** runtime

## 📋 Setup Instructions

### 1. Database Setup

Run the following SQL in your Supabase SQL Editor:

```sql
-- Enable Row Level Security
-- Create agents table
CREATE TABLE agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  business_name TEXT NOT NULL,
  description TEXT,
  profile_image_url TEXT,
  whatsapp_number TEXT NOT NULL,
  location_city TEXT NOT NULL,
  location_state TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  services TEXT[] DEFAULT '{}',
  rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table (tracks 24-hour visibility)
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'NGN',
  payment_provider TEXT,
  payment_id TEXT,
  status TEXT DEFAULT 'pending',
  activated_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_agents_location ON agents(location_city, location_state);
CREATE INDEX idx_agents_services ON agents USING GIN(services);
CREATE INDEX idx_agents_email ON agents(email);
CREATE INDEX idx_payments_agent_status ON payments(agent_id, status, expires_at);

-- Enable Row Level Security
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agents (public can read active agents)
CREATE POLICY "Public can view active agents" ON agents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM payments
      WHERE payments.agent_id = agents.id
        AND payments.status = 'completed'
        AND payments.expires_at > NOW()
    )
  );

CREATE POLICY "Anyone can insert agents" ON agents
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Agents can update own profile by email" ON agents
  FOR UPDATE USING (email IS NOT NULL);

-- RLS Policies for payments (public read)
CREATE POLICY "Public can view completed payments" ON payments
  FOR SELECT USING (status = 'completed');

CREATE POLICY "Anyone can create payments" ON payments
  FOR INSERT WITH CHECK (true);

-- Make user_id nullable
ALTER TABLE agents ALTER COLUMN user_id DROP NOT NULL;
```

### 2. Configure Admin WhatsApp

1. Open `supabase/functions/server/index.tsx`
2. Update the admin WhatsApp number:
```typescript
const ADMIN_WHATSAPP = "+2348012345678"; // Replace with your actual number
```

### 3. Deploy

Your Supabase functions should already be deployed. If not:
```bash
supabase functions deploy
```

## 📖 User Workflows

### Agent Registration & Activation Flow

```
1. Agent visits /dashboard
   ↓
2. Enters email address
   ↓
3. Fills out profile (business name, location, services, WhatsApp)
   ↓
4. Clicks "Contact Admin to Activate"
   ↓
5. WhatsApp opens with pre-filled message to admin
   ↓
6. Admin replies with bank account details
   ↓
7. Agent makes payment and sends proof
   ↓
8. Admin clicks "Activate" in admin panel
   ↓
9. Agent's profile appears on landing page for 24 hours
```

### Customer Discovery Flow

```
1. User visits landing page
   ↓
2. Searches by location/service
   ↓
3. Sees list of active agents
   ↓
4. Clicks "Chat on WhatsApp" on agent card
   ↓
5. WhatsApp opens with pre-filled message
   ↓
6. User and agent coordinate via WhatsApp
```

### Admin Activation Flow

```
1. Admin visits /admin
   ↓
2. Agent contacts via WhatsApp
   ↓
3. Admin provides payment details
   ↓
4. Agent sends payment proof
   ↓
5. Admin finds agent in admin panel
   ↓
6. Clicks "Activate" button
   ↓
7. Enters duration (default 24 hours)
   ↓
8. Agent becomes visible on platform
```

## 🎨 Pages

- **Landing Page** (`/`) - Search and discover active agents
- **Agent Dashboard** (`/dashboard`) - Agent registration and profile management
- **Admin Panel** (`/admin`) - Agent management and activation

## 🔑 Key Differences from Standard Auth Systems

This platform **does not use traditional authentication**:
- ❌ No passwords
- ❌ No signup/login flow
- ❌ No JWT tokens or sessions
- ✅ Email-based identification only
- ✅ All pages are publicly accessible
- ✅ Manual payment verification via WhatsApp

## 💡 Payment Flow

### Traditional Flow (Not Used)
~~Automated Paystack payment → Auto-activation~~

### Current Flow (Manual)
1. Agent contacts admin via WhatsApp
2. Admin provides bank account details
3. Agent makes bank transfer
4. Agent sends payment proof (screenshot)
5. Admin verifies payment
6. Admin manually activates agent in admin panel
7. Agent visible for 24 hours

## 🔒 Security Considerations

Since there's no authentication:
- Agents can access anyone's profile if they know the email
- Anyone can access the admin panel
- Consider adding a simple admin password protection in production
- Use HTTPS in production to protect data in transit

## 📱 WhatsApp Integration

The platform uses WhatsApp for two purposes:

1. **Agent → Admin Communication**
   - Payment requests
   - Activation coordination
   - Support

2. **User → Agent Communication**
   - Service inquiries
   - Booking requests
   - Price negotiations

## 🎯 Future Enhancements

- [ ] Add admin password protection
- [ ] Implement email notifications
- [ ] Add rating and review system
- [ ] Profile image upload
- [ ] Advanced search filters
- [ ] Payment receipt upload
- [ ] Automated expiry notifications

## 📞 Support

For platform support or technical issues, contact the admin via WhatsApp.

---

Built with ❤️ for the logistics industry
