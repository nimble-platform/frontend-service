package eu.nimble.core.frontendservice.utils;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.servlet.ServletContext;

/**
 * Created by Johannes Innerbichler
 */
@Component
public class UrlResolver {

    @Value("${nimble.gatewayProxyUrl}")
    private String gatewayProxyUrl;

    @Value("${nimble.identityRootPath}")
    private String identityRootPath;

    @Value("${nimble.frontendRootPath}")
    private String frontendRootPath;

    public String resolveIdentityService() {
        return gatewayProxyUrl + identityRootPath;
    }

    public String resolveFrontendService() {
        return gatewayProxyUrl + frontendRootPath;
    }

}
