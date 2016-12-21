package eu.nimble.core.frontendservice.controller.registration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;

import static org.springframework.web.bind.annotation.RequestMethod.GET;
import static org.springframework.web.bind.annotation.RequestMethod.POST;

@Controller
public class CompanyRegistrationController {

    private static final Logger logger = LoggerFactory.getLogger(UserRegistrationController.class);

    @RequestMapping(value = "/register_company", method = GET)
    public String companyRegistration(Model model) {
        model.addAttribute("companyRegistrationData", new CompanyRegistrationData());
        return "registration/company_registration";
    }

    @RequestMapping(value = "/register_company.do", method = POST)
    public String companyRegistrationSubmit(@ModelAttribute CompanyRegistrationData companyRegistrationData) {
        logger.info("Registering company");
        return "redirect:/";
    }

    public static class CompanyRegistrationData {

        private String legalname;
        private String address;
        private String vat;

        public String getLegalname() {
            return legalname;
        }

        public void setLegalname(String legalname) {
            this.legalname = legalname;
        }

        public String getAddress() {
            return address;
        }

        public void setAddress(String address) {
            this.address = address;
        }

        public String getVat() {
            return vat;
        }

        public void setVat(String vat) {
            this.vat = vat;
        }
    }
}
