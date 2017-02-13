package eu.nimble.core.frontendservice.controller.registration;

import com.fasterxml.jackson.databind.util.JSONPObject;
import com.google.common.collect.Lists;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import eu.nimble.core.frontendservice.client.identity.UserIdentityClient;
import eu.nimble.core.frontendservice.utils.UrlResolver;
import feign.FeignException;
import org.cloudfoundry.identity.uaa.scim.ScimUser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.servlet.ServletContext;
import java.util.Objects;

import static org.springframework.web.bind.annotation.RequestMethod.GET;
import static org.springframework.web.bind.annotation.RequestMethod.POST;

@Controller
public class UserRegistrationController {

    private static final Logger logger = LoggerFactory.getLogger(UserRegistrationController.class);

    @Autowired
    private ServletContext context;

    @Autowired
    private UrlResolver urlResolver;

    @RequestMapping(value = "/register_user", method = GET)
    public String userRegistration(Model model) {
        model.addAttribute("userRegistrationData", new UserRegistrationData());
        model.addAttribute("identityService", urlResolver.resolveIdentityService());
        return "registration/user_registration";
    }

    @RequestMapping(value = "/register_user.do", method = POST, produces = "application/json")
    public @ResponseBody String userRegistrationSubmit(@ModelAttribute UserRegistrationData userRegistrationData) {

        logger.info("Registering client {} with mail {}", userRegistrationData.familyName, userRegistrationData.email);

//        // TODO: handle error
//        if (isUserDataValid(userRegistrationData) != true)
//            return "redirect:/register_user";
//
//        try {
//            ResponseEntity<ScimUser> responseEntity = userIdentityClient.addUser(userRegistrationData.getFirstName(),
//                    userRegistrationData.getFamilyName(),
//                    userRegistrationData.getEmail(),
//                    userRegistrationData.getPassword());
//        } catch (FeignException ex ) {
//            logger.error("Error while adding user" + userRegistrationData.email, ex);
//            return "redirect:/register_user";
//        }

        String identityService = urlResolver.resolveIdentityService();

        JsonObject response = new JsonObject();
        response.addProperty("redirectUrl", context.getContextPath() + "/register_company");
        return new Gson().toJson(response);
    }

    private Boolean isUserDataValid(UserRegistrationData userData) {
        return Lists.newArrayList(
                userData.firstName,
                userData.familyName,
                userData.email,
                userData.password
        ).stream().allMatch(Objects::nonNull);
    }

    @SuppressWarnings({"unused", "WeakerAccess"})
    public static class UserRegistrationData {

        private String firstName;
        private String familyName;
        private String email;
        private String password;

        public String getFirstName() {
            return firstName;
        }

        public void setFirstName(String firstName) {
            this.firstName = firstName;
        }

        public String getFamilyName() {
            return familyName;
        }

        public void setFamilyName(String familyName) {
            this.familyName = familyName;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }
}
