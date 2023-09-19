drop table if exists Plugins cascade;
CREATE TABLE Plugins (
    id SERIAL PRIMARY KEY,
    plugin_name VARCHAR(64),
    login_url VARCHAR(128),
    logout_url VARCHAR(128),
    refresh_url VARCHAR(128),
    status_url VARCHAR(128)
);