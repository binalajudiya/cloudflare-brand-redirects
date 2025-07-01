CREATE TABLE IF NOT EXISTS click_log (
    id TEXT PRIMARY KEY,           -- Unique ID for this event (e.g., UUID)
    timestamp TEXT NOT NULL,       -- ISO 8601 timestamp (e.g., '2025-06-26T10:30:00Z')
    gclid TEXT,                    -- The Google Click ID (can be NULL)
    final_url TEXT NOT NULL,       -- The final URL the user was redirected to
    -- Optional: Add other fields like account_id for easier querying later
    account_id TEXT                -- Store which AUxxx account this log is from
);