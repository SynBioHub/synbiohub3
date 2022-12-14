CREATE TABLE Users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(64),
    username VARCHAR(64) NOT NULL,
    password VARCHAR(64) NOT NULL,
    email VARCHAR(128),
    affiliation VARCHAR(256),
    isAdmin BOOLEAN DEFAULT FALSE,
    isCurator BOOLEAN DEFAULT FALSE
);