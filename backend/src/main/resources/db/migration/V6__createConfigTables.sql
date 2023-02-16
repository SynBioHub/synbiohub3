DROP TABLE IF EXISTS Instances CASCADE;
DROP TABLE IF EXISTS Themes CASCADE;
DROP TABLE IF EXISTS Triple_Stores CASCADE;
DROP TABLE IF EXISTS Configurations CASCADE;

CREATE TABLE Instances (
    id SERIAL PRIMARY KEY,
    instance_uri VARCHAR(64) NOT NULL,
    description VARCHAR(1024),
    name VARCHAR(64)
);

CREATE TABLE Themes (
    id SERIAL PRIMARY KEY,
    theme_name VARCHAR(128),
    base_color VARCHAR(16)
);

CREATE TABLE Triple_Stores (
    id SERIAL PRIMARY KEY,
    sparql_endpoint VARCHAR(128),
    graph_store_endpoint VARCHAR(128),
    default_graph VARCHAR(128),
    graph_prefix VARCHAR(128),
    username VARCHAR(64),
    password VARCHAR(64),
    virtuoso_ini VARCHAR(128),
    virtuoso_db VARCHAR(128),
    isql VARCHAR(64)
);

CREATE TABLE Configurations (
    id SERIAL PRIMARY KEY,
    instance_id BIGINT NOT NULL,
    theme_id BIGINT NOT NULL,
    port int NOT NULL,
    triple_store_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    CONSTRAINT fk_instance FOREIGN KEY (instance_id) REFERENCES Instances(id),
    CONSTRAINT fk_theme FOREIGN KEY (theme_id) REFERENCES Themes(id),
    CONSTRAINT fk_triple_store FOREIGN KEY (triple_store_id) REFERENCES Triple_Stores(id),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES Users(id),
    allow_public_signup BOOLEAN DEFAULT TRUE
);


