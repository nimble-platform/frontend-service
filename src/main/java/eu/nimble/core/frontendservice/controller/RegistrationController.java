package eu.nimble.core.frontendservice.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import static org.springframework.web.bind.annotation.RequestMethod.*;

@Controller
public class RegistrationController {

    private static final Logger logger = LoggerFactory.getLogger(RegistrationController.class);

    @RequestMapping(value = "/register_user", method = GET)
    public String userRegistration(Model model) {
        model.addAttribute("userRegistrationData", new UserRegistrationData());
        return "registration/user_registration";
    }

    @RequestMapping(value = "/register_user.do", method = POST)
    public String userRegistrationSubmit(@ModelAttribute UserRegistrationData userRegistrationData) {
        logger.info("Registering user {} with mail {}", userRegistrationData.familyName, userRegistrationData.email);
        return "/register_company";
    }

    @RequestMapping(value = "/register_company", method = GET)
    public String companyRegistration(Model model) {
        model.addAttribute("userRegistrationData", new UserRegistrationData());
        return "registration/comapany_registration";
    }

    @RequestMapping(value = "/register_company.do", method = POST)
    public String companyRegistrationSubmit(@ModelAttribute UserRegistrationData userRegistrationData) {
        logger.info("Registering company");
        return "/";
    }

    public static class UserRegistrationData {

        public String firstName;
        public String familyName;
        public String email;
        public String password;

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
