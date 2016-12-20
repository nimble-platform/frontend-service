package eu.nimble.core.frontendservice;

import com.netflix.appinfo.InstanceInfo;
import com.netflix.discovery.EurekaClient;
import eu.nimble.core.frontendservice.user.UserIdentityClient;
import feign.FeignException;
import org.cloudfoundry.identity.uaa.scim.ScimUser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.cloud.client.circuitbreaker.EnableCircuitBreaker;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;
import org.springframework.cloud.netflix.feign.EnableFeignClients;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;

import javax.servlet.http.HttpServletResponse;

import static org.springframework.web.bind.annotation.RequestMethod.*;

@ComponentScan
@Configuration
@EnableCircuitBreaker
@EnableAutoConfiguration
@EnableEurekaClient
@EnableFeignClients
@RestController
public class Application {

    private static Logger logger = LoggerFactory.getLogger(Application.class);

    @Autowired
    private UserIdentityClient userIdentityClient;

    @Autowired
    private EurekaClient discoveryClient;

    @RequestMapping(value = "/user", method = GET, produces = "application/json")
    public ScimUser getUser(@RequestParam("user_name") String userName, HttpServletResponse response) throws Exception {

        logger.info("Fetching user with username '{}'", userName);

        try {
            return userIdentityClient.getUser(userName);
        }
        catch (FeignException e) {
            response.sendError(e.status(), e.getMessage());
        }
        return null;
    }

    public static void main(String[] args) {
        new SpringApplicationBuilder(Application.class).web(true).run(args);
    }
}