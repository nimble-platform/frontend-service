package eu.nimble.core.frontendservice.user;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@SuppressWarnings("WeakerAccess")
class UserIdentityExceptions {
    @ResponseStatus(value = HttpStatus.GONE, reason = "This user is not found in the system")
    public static class UserNotFoundException extends Exception {
        private static final long serialVersionUID = 100L;
    }
}
