package eu.nimble.core.frontendservice.client.identity;

import org.springframework.cloud.netflix.feign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.cloudfoundry.identity.uaa.scim.ScimUser;

import static org.springframework.web.bind.annotation.RequestMethod.*;

@Component
@FeignClient(value = "identity-service", path = "/user")
public interface UserIdentityClient {

    @RequestMapping(method = POST)
    ResponseEntity<ScimUser> addUser(
            @RequestParam(value = "first_name") String firstName,
            @RequestParam(value = "family_name") String familyName,
            @RequestParam(value = "email") String email,
            @RequestParam(value = "password") String password);

    @RequestMapping(method = GET)
    ScimUser getUser(@RequestParam(value = "user_name") String userName);
}

