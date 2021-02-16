package com.synbiohub.sbh3.sqlite;

import org.springframework.jdbc.core.RowMapper;

import java.sql.ResultSet;
import java.sql.SQLException;

public class UserRowMapper implements RowMapper<User> {

    @Override
    public User mapRow(ResultSet resultSet, int i) throws SQLException {
        User user = new User();
        user.setId(resultSet.getInt("id"));
        user.setName(resultSet.getString("name"));
        user.setUsername(resultSet.getString("username"));
        user.setEmail(resultSet.getString("email"));
        user.setAffiliation(resultSet.getString("affiliation"));
        user.setPassword(resultSet.getString("password"));
        user.setGraphUri(resultSet.getString("graphUri"));
        boolean isAdmin = resultSet.getInt("isAdmin") > 0;  // we need to convert the int in SQLite to a boolean (SQLite does not support native boolean types
        user.setAdmin(isAdmin);
        user.setResetPasswordLink(resultSet.getString("resetPasswordLink"));
        boolean isCurator = resultSet.getInt("isCurator") > 0;
        user.setCurator(isCurator);
        boolean isMember = resultSet.getInt("isMember") > 0;
        user.setMember(isMember);
        user.setCreatedAt(resultSet.getTimestamp("createdAt"));
        user.setUpdatedAt(resultSet.getTimestamp("updatedAt"));
        return user;
    }
}
