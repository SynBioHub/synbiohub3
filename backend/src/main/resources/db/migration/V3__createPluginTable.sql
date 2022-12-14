CREATE TABLE Plugins (
    id SERIAL PRIMARY KEY,
    name VARCHAR(64),
    login_url VARCHAR(128),
    logout_url VARCHAR(128),
    refresh_url VARCHAR(128),
    status_url VARCHAR(128)
);