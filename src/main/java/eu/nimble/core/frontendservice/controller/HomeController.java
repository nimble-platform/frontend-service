package eu.nimble.core.frontendservice.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;

import static org.springframework.web.bind.annotation.RequestMethod.GET;

@Controller
public class HomeController {
    private static final Logger logger = LoggerFactory.getLogger(RegistrationController.class);

    @RequestMapping(value = {"/", "/index.html"}, method = GET)
    public String registration(Model model) {
        return "index";
    }
}
