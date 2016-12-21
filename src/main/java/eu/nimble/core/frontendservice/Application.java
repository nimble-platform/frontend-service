package eu.nimble.core.frontendservice;

import eu.nimble.core.frontendservice.user.UserIdentityClient;
import feign.FeignException;
import org.cloudfoundry.identity.uaa.scim.ScimUser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.cloud.client.circuitbreaker.EnableCircuitBreaker;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;
import org.springframework.cloud.netflix.feign.EnableFeignClients;
import org.springframework.cloud.netflix.feign.FeignAutoConfiguration;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletResponse;

import static org.springframework.web.bind.annotation.RequestMethod.GET;

@SpringBootApplication
@ComponentScan
@Configuration
@EnableCircuitBreaker
@EnableAutoConfiguration
// Avoid NPE during startup with dev tools (https://github.com/spring-cloud/spring-cloud-netflix/issues/1366)
@ImportAutoConfiguration(FeignAutoConfiguration.class)
@EnableEurekaClient
@EnableFeignClients
@RestController
public class Application {

    private static Logger logger = LoggerFactory.getLogger(Application.class);

    @Autowired
    private UserIdentityClient userIdentityClient;

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