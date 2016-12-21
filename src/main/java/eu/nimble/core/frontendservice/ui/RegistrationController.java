package eu.nimble.core.frontendservice.ui;

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

    @RequestMapping(value = "/register", method = GET)
    public String registration(Model model) {
        model.addAttribute("userRegistrationData", new UserRegistrationData());
        return "registration";
    }

    @RequestMapping(value = "/register.do", method = POST)
    public String registrationSubmit(@ModelAttribute UserRegistrationData userRegistrationData) {
        logger.info("Registering user {} with mail {}", userRegistrationData.familyName, userRegistrationData.email);
        return "result";
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
