package eu.nimble.core.frontendservice.controller;

import eu.nimble.core.frontendservice.controller.registration.UserRegistrationController;
import eu.nimble.core.frontendservice.utils.UrlResolver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;

import static org.springframework.web.bind.annotation.RequestMethod.GET;

@Controller
public class HomeController {
    private static final Logger logger = LoggerFactory.getLogger(UserRegistrationController.class);

    @Autowired
    private UrlResolver urlResolver;

    @RequestMapping(value = {"/", "/index.html  "}, method = GET)
    public String registration(Model model) {
        return "redirect:" + urlResolver.resolveFrontendService() + "/register_user";
    }

    @RequestMapping(value = "user_details", method = GET)
    public String userDetails(Model model) {
        return "user/user_details";
    }
}
