drop table if exists Auth cascade;
CREATE TABLE Auth (
    id SERIAL PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    auth VARCHAR(512)
);