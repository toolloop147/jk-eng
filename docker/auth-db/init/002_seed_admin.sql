-- Default developer account: admin / admin123
INSERT INTO users (email, password_hash, name, is_active)
VALUES (
    'admin@jk.local',
    '$2b$10$rEokbIZCd9Oky02sFypAo.0vMCR30t/5.gQqIvB5cHDWAh7K.GM3O',
    'Administrator',
    true
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_app_access (user_id, app_code, role)
SELECT u.id, a.code, 'admin'
FROM users u
CROSS JOIN (VALUES ('op'), ('ins'), ('eng')) AS a(code)
WHERE u.email = 'admin@jk.local'
ON CONFLICT (user_id, app_code) DO NOTHING;
