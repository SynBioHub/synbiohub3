package com.synbiohub.sbh3.dto.submit;

import com.synbiohub.sbh3.security.model.User;
import lombok.Builder;
import lombok.Value;

/**
 * Identity for a submission, taken only from the authenticated {@link User} — never from the client body.
 */
@Value
@Builder
public class SubmitCreatedBy {
    String username;
    /** {@link User#getName()} */
    String fullName;
    String email;
    /** User's private RDF graph IRI, if configured on the account. */
    String graphUri;

    public static SubmitCreatedBy fromUser(User user) {
        if (user == null) {
            return null;
        }
        return SubmitCreatedBy.builder()
                .username(user.getUsername())
                .fullName(user.getName() != null ? user.getName() : "")
                .email(user.getEmail() != null ? user.getEmail() : "")
                .graphUri(user.getGraphUri() != null ? user.getGraphUri() : "")
                .build();
    }
}
