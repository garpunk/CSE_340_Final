-- Run once if your database still has placeholder hashes from an older seed.
-- Password for all three accounts: P@$$w0rd!
UPDATE users SET password_hash = '$2b$10$HFL.tGAAejgzHNOkOxd9wuYn50crd/3VMHIeHwZQPB2Fo/k4/NCgq'
WHERE email IN ('admin@campus.local', 'staff@campus.local', 'student@campus.local');
