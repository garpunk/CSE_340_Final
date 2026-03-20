INSERT INTO categories (name, description)
VALUES
    ('Network Issue', 'Wi-Fi, ethernet, VPN, or connectivity problems'),
    ('Hardware Issue', 'Laptop, monitor, keyboard, printer, or device issues'),
    ('Software Issue', 'App installs, crashes, license issues, or access problems');

-- Password for all seed accounts (README): P@$$w0rd!
INSERT INTO users (name, email, password_hash, role)
VALUES
    ('Admin User', 'admin@campus.local', '$2b$10$HFL.tGAAejgzHNOkOxd9wuYn50crd/3VMHIeHwZQPB2Fo/k4/NCgq', 'admin'),
    ('Staff User', 'staff@campus.local', '$2b$10$HFL.tGAAejgzHNOkOxd9wuYn50crd/3VMHIeHwZQPB2Fo/k4/NCgq', 'staff'),
    ('Student User', 'student@campus.local', '$2b$10$HFL.tGAAejgzHNOkOxd9wuYn50crd/3VMHIeHwZQPB2Fo/k4/NCgq', 'user');

INSERT INTO tickets (title, description, status, user_id, assigned_to, category_id)
VALUES
    (
        'Cannot connect to campus Wi-Fi',
        'My laptop keeps failing to join the secure wireless network in the library.',
        'open',
        3,
        2,
        1
    ),
    (
        'Laptop keyboard not working',
        'Several keys stopped responding after this morning.',
        'in_progress',
        3,
        2,
        2
    );

INSERT INTO ticket_comments (ticket_id, user_id, comment)
VALUES
    (1, 3, 'This started around 9 AM after I changed my password.'),
    (1, 2, 'Checking account sync and wireless profile settings now.'),
    (2, 2, 'Device received at helpdesk for hardware inspection.');
