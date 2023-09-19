drop table if exists Users cascade;
CREATE TABLE Users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(64),
    username VARCHAR(64) NOT NULL,
    user_password VARCHAR(128) NOT NULL,
    email VARCHAR(128),
    affiliation VARCHAR(256),
    user_role VARCHAR(64) NOT NULL
);