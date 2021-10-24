CREATE TABLE Users (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR,
    username VARCHAR NOT NULL,
    password VARCHAR NOT NULL,
    email VARCHAR,
    affiliation VARCHAR,
    isAdmin BOOLEAN DEFAULT FALSE,
    isCurator BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (id),
    UNIQUE (username)
);