drop table if exists User_Configurations cascade;
CREATE TABLE User_Configurations (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    configuration_id BIGINT NOT NULL,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES Users(id),
    CONSTRAINT fk_configuration FOREIGN KEY (configuration_id) REFERENCES Configurations(id)
);