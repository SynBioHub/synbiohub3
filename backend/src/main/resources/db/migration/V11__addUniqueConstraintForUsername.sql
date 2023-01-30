alter table users add constraint users_username_unique unique(username);
alter table users add constraint users_email_unique unique(email);
alter table users alter column "role" set not null;