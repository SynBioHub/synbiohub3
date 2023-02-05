DROP TABLE CONFIG;
CREATE TABLE CONFIG (
    id SERIAL Primary Key,
    "instance_id" BIGINT,
    "config" TEXT,
    "type" VarChar(16)
);