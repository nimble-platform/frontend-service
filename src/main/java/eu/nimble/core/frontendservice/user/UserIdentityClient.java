package eu.nimble.core.frontendservice.user;

import org.springframework.cloud.netflix.feign.FeignClient;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.cloudfoundry.identity.uaa.scim.ScimUser;

import static org.springframework.web.bind.annotation.RequestMethod.*;

@Component
@FeignClient(value = "identity-service")
public interface UserIdentityClient {
    @RequestMapping(value = "/user", method = GET)
    ScimUser getUser(@RequestParam(value = "user_name") String userName);
}

