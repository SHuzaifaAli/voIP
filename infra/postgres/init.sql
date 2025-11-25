-- CallStack Database Initialization Script
-- This script sets up the initial database structure for development

-- Create database if it doesn't exist
-- CREATE DATABASE IF NOT EXISTS callstack;

-- Use the callstack database
-- \c callstack;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE IF NOT EXISTS user_role AS ENUM ('USER', 'ADMIN', 'OPERATOR');
CREATE TYPE IF NOT EXISTS call_status AS ENUM ('INITIATED', 'RINGING', 'CONNECTED', 'ENDED', 'FAILED', 'MISSED');
CREATE TYPE IF NOT EXISTS call_type AS ENUM ('AUDIO', 'VIDEO', 'SCREEN_SHARE');
CREATE TYPE IF NOT EXISTS call_direction AS ENUM ('INBOUND', 'OUTBOUND');
CREATE TYPE IF NOT EXISTS phone_number_cap AS ENUM ('VOICE', 'SMS', 'MMS', 'FAX');

-- Create indexes for better performance
-- These will be created by Prisma, but listed here for reference

-- Users table indexes
-- CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
-- CREATE INDEX IF NOT EXISTS idx_users_sip_username ON users(sip_username);
-- CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Calls table indexes
-- CREATE INDEX IF NOT EXISTS idx_calls_caller_id ON calls(caller_id);
-- CREATE INDEX IF NOT EXISTS idx_calls_callee_id ON calls(callee_id);
-- CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(status);
-- CREATE INDEX IF NOT EXISTS idx_calls_start_time ON calls(start_time);

-- Call Detail Records indexes
-- CREATE INDEX IF NOT EXISTS idx_cdrs_user_id ON call_detail_records(user_id);
-- CREATE INDEX IF NOT EXISTS idx_cdrs_call_id ON call_detail_records(call_id);
-- CREATE INDEX IF NOT EXISTS idx_cdrs_start_time ON call_detail_records(start_time);

-- Sample data for testing
-- This would be inserted through the application, not directly in SQL

-- Example: Create a test user
-- INSERT INTO users (id, email, name, password, role, is_active, created_at, updated_at)
-- VALUES (
--   uuid_generate_v4(),
--   'test@example.com',
--   'Test User',
--   crypt('password123', gen_salt('bf')),
--   'USER',
--   true,
--   NOW(),
--   NOW()
-- );

-- Example: Create a test phone number
-- INSERT INTO phone_numbers (id, number, country, is_active, capabilities, created_at, updated_at)
-- VALUES (
--   uuid_generate_v4(),
--   '+15551234567',
--   'US',
--   true,
--   ARRAY['VOICE', 'SMS'],
--   NOW(),
--   NOW()
-- );

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
-- These will be managed by Prisma, but listed here for reference

-- Example trigger (Prisma handles this automatically)
-- CREATE TRIGGER update_users_updated_at 
--     BEFORE UPDATE ON users 
--     FOR EACH ROW 
--     EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO callstack;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO callstack;

-- Create view for active users
CREATE OR REPLACE VIEW active_users AS
SELECT 
    id,
    email,
    name,
    role,
    created_at
FROM users 
WHERE is_active = true;

-- Create view for call statistics
CREATE OR REPLACE VIEW call_statistics AS
SELECT 
    DATE(start_time) as call_date,
    COUNT(*) as total_calls,
    COUNT(CASE WHEN status = 'CONNECTED' THEN 1 END) as connected_calls,
    AVG(duration) as avg_duration_seconds,
    COUNT(CASE WHEN call_type = 'VIDEO' THEN 1 END) as video_calls
FROM calls
GROUP BY DATE(start_time)
ORDER BY call_date DESC;

-- Create view for billing summary
CREATE OR REPLACE VIEW billing_summary AS
SELECT 
    cdrs.user_id,
    u.email,
    COUNT(*) as total_calls,
    SUM(cdrs.duration) as total_minutes,
    SUM(cdrs.cost) as total_cost,
    c.currency
FROM call_detail_records cdrs
JOIN users u ON cdrs.user_id = u.id
JOIN calls c ON cdrs.call_id = c.id
WHERE cdrs.end_time >= NOW() - INTERVAL '30 days'
GROUP BY cdrs.user_id, u.email, c.currency;