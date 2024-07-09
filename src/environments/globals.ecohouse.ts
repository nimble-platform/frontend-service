'use strict';

// Development variables

export const debug = false;


// Base path variables

export const base_path = "http://nimble-dev.ikap.biba.uni-bremen.de";
// export const ub_base = "http://nimble-dev.ikap.biba.uni-bremen.de:10096";
export const ub_base = "http://realfranky.ddns.net:8090";
export const idpURL = "http://nimble-dev.ikap.biba.uni-bremen.de:8080/auth/realms/master";
export const collab_path = "http://nimble.eu-de.containers.appdomain.cloud/collaborations";
export const pw_reset_link = idpURL + "/login-actions/reset-credentials?client_id=nimble_client";
export const frontendURL = base_path + "/frontend/";


// Service endpoints

export const user_mgmt_endpoint = `${base_path}/identity`;
export const catalogue_endpoint = `${base_path}/catalog`;
export const catalogue_endpoint_with_zuul = `${base_path}/zuul/catalog`;
export const bpe_endpoint = `${base_path}/business-process`;
export const data_channel_endpoint = `${base_path}/data-channel`;
export const data_aggregation_endpoint = `${base_path}/data-aggregation`;
export const trust_service_endpoint = `${base_path}/trust`;
export const indexing_service_endpoint = `${base_path}/index`;
export const rocketChatEndpoint = `${base_path}:3000`;
export const logstash_endpoint = `${base_path}/logstash`;
export const kibana_endpoint = `${base_path}/kibana/app/kibana`;
export const delegate_endpoint = `${base_path}:9265`;
export const agent_mgmt_endpoint = `http://159.69.214.42/agents`;
export const collaboration_endpoint = `${collab_path}`;
export const certificate_of_origin_endpoint = `http://161.156.70.125:7695`;
export const legislation_endpoint = `http://77.230.101.223/nimsys`;
export const eFactory_indexing_endpoint = "https://efactory-security-portal.salzburgresearch.at/api/index";

// Explorative Search endpoints

export const languageEndPoint = `${ub_base}/getSupportedLanguages`;
export const endpoint = `${ub_base}/detectMeaningLanguageSpecific`;
export const logicalViewEndpoint = `${ub_base}/getLogicalView`;
export const propertyEndPoint = `${ub_base}/getPropertyValuesDiscretised`;
export const sparqlEndPoint = `${ub_base}/executeSPARQLSelect`;
export const sparqlOptionalSelectEndPoint = `${ub_base}/executeSPARQLOptionalSelect`;
export const spqButton = `${ub_base}/getSQPFromOrangeGroup`;
export const obs_propFromConcept = `${ub_base}/getPropertyFromConcept`;
export const obs_propValueFromConcept = `${ub_base}/getPropertyValuesFromGreenGroup`;
export const referenceFromConcept = `${ub_base}/getReferencesFromAConcept`;
export const sqpOrangeConcept = `${ub_base}/getPropertyValuesFromOrangeGroup`;


// Track & Trace endpoints

export const tntEndpoint = `${base_path}/tracking`;
export const tntMasterDataEndpoint = `${base_path}/tracking/masterData/id/`;
export const tntAnalysisEndpoint = `${base_path}/tracking-analysis/`;
export const tntIoTBlockchainEndpoint = `${base_path}/iot-bc-api/api/verify`;

// SME Cluster endpoints
export const smeClusterCreateOpportunityEndpoint = "https://www.smecluster.com/my-opportunities/create-opportunity";

// Platform Configuration

export const config = {
    "federationInstanceId": "ECO-HOUSE",
    "platformName": "Eco-House",
    "platformNameInMail":"NIMBLE",
    "envName": "ecohouse",
    "addCartBehaviour": "single",
    "catalogExchangeEnabled": false,
    "companyRegistrationRequired": false,
    "categoryFilter": {
        "eClass": {
            "hiddenCategories": [],
            "logisticsCategory": "14000000",
            "ontologyPrefix": "http://www.nimble-project.org/resource/eclass#"
        },
        "FurnitureOntology": {
            "hiddenCategories": ["Catalogue", "Company", "ContactPerson", "Guarantee", "Price", "Process", "Standard", "Style", "Technique"],
            "logisticsCategory": "LogisticsService",
            "ontologyPrefix": "http://www.aidimme.es/FurnitureSectorOntology.owl#"
        }
    },
    circularEconomy: {
        certificateGroup: 'Circular Economy (Environment / Sustainability)',
        companyCertificates: [
            'ISO 14001 Environmental Management System',
            'ISO 14006 Eco Design',
            'ISO 50001 Energy Efficiency',
            'Sustainability Report',
            'Corporate Carbon Footprint'
        ],
        productCertificates: [
            'PEFC Certificate',
            'FSC Certificate',
            'Type I Ecolabel (ECO LABEL, NF Environment, Blue Angel, etc)',
            'Type III Ecolabel (Environmental Product Declaration / Product Footprint)',
            'Free of Hazardous Substances'
        ],
        indexField: "circularEconomyCertificates"
    },
    "contractForCatalogueEnabled":false,
    "collaborationEnabled": false,
    "collapsiblePropertyFacets": false,
    "companyInformationInSearchResult": "BusinessType",
    "dataChannelsEnabled": true,
    "defaultBusinessProcessIds": [
    ],
    "defaultSearchIndex": "Name",
    "delegationEnabled": true,
    "demandsEnabled": false,
    "displayCategoryCounts":true,
    "displayProductIdInOverview": true,
    "docLink": "https://www.nimble-project.org/docs/",
    "emptyImage": "../assets/empty_img.png",
    "enableActionButtonsForTermsAndConditions":false,
    "enableOtherFiltersSearch": false,
    "enableStripePayment": false,
    "enableSubscriptions": false,
    "enableTenderAndBidManagementToolIntegration": false,
    "enableTermsAndConditionsAsFile": false,
    "faviconPath": "./assets/favicon.ico",
    "frameContractTabEnabled": true,
    "fundingDisclaimer": {
        "en": "Copyright © 2024 Kolayam Limited"
    },
    "hideContactInformationInCompanyDetails": false,
    "hideLogAnalytics": false,
    "hidePriceFunctionality": false,
    "hideTradeDetailsTab": false,
    "hideVisitStats": false,
    "imprint": {
        "en": "<table class='table table-borderless'><tr><td class='w-50 p-0 pr-3'><u>Platform Owner</u><br/><b>Lindbäcks Bygg Aktiebolag</b><br/>Hammarvägen 21<br/>94336 Öjebyn<br/>Sweden<br/></td><td class='w-50 p-0 pl-3'><u>Platform Provider</u><br/><b>Universität Bremen</b><br/>Bibliothekstraße 1<br/>28359 Bremen, Germany<br/>Phone: +49 421 218-1<br/>Internet: <a href='https://www.uni-bremen.de' target='_blank'>www.uni-bremen.de</a><br/>Die Universität Bremen ist eine Körperschaft des Öffentlichen Rechts. Sie wird durch den Rektor Prof. Dr.-Ing. Bernd Scholz-Reiter gesetzlich vertreten.\n" +
            "Zuständige Aufsichtsbehörde ist die Senatorin für Wissenschaft, Gesundheit und Verbraucherschutz, Rembertiring 8 – 12, 28195 Bremen.<br/>DE 811 245 070 (gemäß § 27 a UStG)<br/></td></tr></table>",
        "es": "<table class='table table-borderless'><tr><td class='w-50 p-0 pr-3'><u>Dueño de la Plataforma</u><br/><b>Lindbäcks Bygg Aktiebolag</b><br/>Hammarvägen 21<br/>94336 Öjebyn<br/>Suecia<br/></td><td class='w-50 p-0 pl-3'><u>Proveedor de Plataforma</u><br/><b>Universität Bremen</b><br/>Bibliothekstraße 1<br/>28359 Bremen, Alemania<br/>Teléfono: +49 421 218-1<br/>Internet: <a href='https://www.uni-bremen.de' target='_blank'>www.uni-bremen.de</a><br/>Die Universität Bremen ist eine Körperschaft des Öffentlichen Rechts. Sie wird durch den Rektor Prof. Dr.-Ing. Bernd Scholz-Reiter gesetzlich vertreten.\n" +
            "Zuständige Aufsichtsbehörde ist die Senatorin für Wissenschaft, Gesundheit und Verbraucherschutz, Rembertiring 8 – 12, 28195 Bremen.<br/>DE 811 245 070 (gemäß § 27 a UStG)<br/></td></tr></table>"
    },
    "invitationToPlatformEnabled": false,
    "kibanaConfig": {
        "companyDashboards": [],
        "companyGraphs": [],
        "dashboards": []
    },
    "kibanaEnabled": false,
    "languageSettings": {
        "available": ["en", "sv"],
        "fallback": "en"
    },
    "loggingEnabled": false,
    "logoPath": "./assets/eco_house_logo.png",
    "federationLogoPath": "./assets/logo_mvp_efactory.png",
    "logoRequired": false,
    "networkEnabled": false,
    "nonPublicInformationFunctionalityEnabled": false,
    "paymentMeans": [
        "Credit Card",
        "ACH Transfer",
        "Wire Transfer",
        "Cash On Delivery"
    ],
    "paymentTerms": [
        {
            id: "Payment_In_Advance",
            name: "Payment in advance",
            abbreviation: "PIA"
        },
        {
            id: "End_of_month",
            name: "End of month",
            abbreviation: "EOM"
        },
        {
            id: "Cash_next_delivery",
            name: "Cash next delivery",
            abbreviation: "CND"
        },
        {
            id: "Cash_before_shipment",
            name: "Cash before shipment",
            abbreviation: "CBS"
        },
        {
            id: "Cash_on_delivery",
            name: "Cash on delivery",
            abbreviation: "COD"
        },
        {
            id: "Cash_with_order",
            name: "Cash with order",
            abbreviation: "CWO"
        },
        {
            id: "Cash_in_advance",
            name: "Cash in advance",
            abbreviation: "CIA"
        },
    ],
    "permanentWelcomeTab": false,
    "phoneNumberRequired": false,
    "productServiceFiltersEnabled":true,
    "productOfferingEnabled":false,
    "vatEnabled": true,
    "projectsEnabled": true,
    "replaceLegalRepresentativeWithCompanyAdmin": false,
    "requiredAgreements": [
        {
            "title": "End-User License Agreement (EULA)",
            "src": "./assets/eula.pdf"
        }
    ],
    "separateFilterForCircularEconomyCertificatesInCompanySearch": false,
    "showChat": false,
    "showAgent": false,
    "showBusinessKeywordsInCompanyDetails":true,
    "showBusinessProcessBreakdownForPlatformAnalytics": false,
    "showCompanyMembers": false,
    "showCompanyDetailsInPlatformMembers":false,
    "showExplorative": true,
    "showFullName": false,
    "showGoogleTranslateOption": false,
    "showHomepage": false,
    "showLCPA": true,
    "showPPAP": true,
    "showTrack": true,
    "showTrade": true,
    "showTrustScore": true,
    "showVerification": true,
    "standardCurrency": "SEK",
    "standardTaxonomy": "FurnitureOntology",
    "supportedActivitySectors": {
        "": [],
        "Logistics Provider": [],
        "Manufacturer": [],
        "Service Provider": [],
        "Other": []
    },
    "supportedBusinessTypes": [
        "",
        "Logistics Provider",
        "Manufacturer",
        "Service Provider",
        "Other"
    ],
    "supportedCertificates": [
        "Appearance Approval Report",
        "Checking Aids",
        "Control Plan",
        "Customer Engineering Approval",
        "Customer Specific Requirements",
        "Design Documentation",
        "Design Failure Mode and Effects Analysis",
        "Dimensional Results",
        "Engineering Change Documentation",
        "Initial Process Studies",
        "Master Sample",
        "Measurement System Analysis Studies",
        "Part Submission Warrant",
        "Process Failure Mode and Effects Analysis",
        "Process Flow Diagram",
        "Qualified Laboratory Documentation",
        "Records of Material / Performance Tests",
        "Sample Production Parts",
        "Other"
    ],
    "supportedRoles": [
        "company_admin",
        "external_representative",
        "legal_representative",
        "monitor",
        "publisher",
        "purchaser",
        "sales_officer"
    ],
    "supportMail": "wel1@biba.uni-bremen.de",
    "supportMailContent": {
        "en": "Dear NIMBLE support team,\n\n\nI have encountered an issue.\n\nDescription of the issue:\n[Please insert a detailed description of the issue here. Add some screenshots as an attachment if they are of use.]"
    },
    "showLoginFederation": false,
    "unshippedOrdersTabEnabled": true,
    "welcomeMessage":{
        "en": "Looks like you are new here.",
        "es": "Parece que eres nuevo aquí.",
        "de": "Sieht aus, als seien Sie neu hier.",
    },
    "whiteBlackListForCatalogue":false,
    "federationClientID": "sample-client",
    "federationIDP": "sampleIDP",
    "smeFederationIDP": "sampleIDP",
    "legislationSettings": {
        "enabled": false,
        "authMode": "nimble",
        "datePlaceholder": "yyyy-mm-dd"
    },
    "demo": {
        "enabled": false,
        "disclaimer": {
            "en": ""
        },
        "account": {
            "name": "",
            "user": "",
            "pw": ""
        }
    }
};


// Catalogue format variables

export const product_vendor = "manufacturer";
export const product_vendor_id = "id";
export const product_vendor_img = "logoId";
export const product_vendor_name = "legalName";
export const product_vendor_brand_name = "brandName";
export const product_vendor_rating = "trustRating";
export const product_vendor_rating_seller = "trustSellerCommunication";
export const product_vendor_rating_fulfillment = "trustFullfillmentOfTerms";
export const product_vendor_rating_delivery = "trustDeliveryPackaging";
export const product_vendor_evaluation = "trustNumberOfEvaluations";
export const product_vendor_trust = "trustScore";
export const product_name = "label";
export const class_label = "classification.allLabels";
export const product_description = "description";
export const product_img = "imgageUri";
export const product_price = "price";
export const product_price_hidden = "priceHidden";
export const product_delivery_time = "deliveryTime";
export const product_currency = "currency";
export const product_cat = "classificationUri";
export const product_cat_mix = "commodityClassficationUri";
export const product_filter_prod = ["freeOfCharge", "circularEconomyCertificates","certificateType", "applicableCountries", "customizable"];
export const product_filter_comp = ["manufacturer.legalName", "manufacturer.brandName", "manufacturer.businessType", "manufacturer.activitySectors", "manufacturer.businessKeywords", "manufacturer.origin", "manufacturer.circularEconomyCertificates","manufacturer.certificateType", "manufacturer.ppapComplianceLevel", "manufacturer.ppapDocumentType"];
export const party_identifying_regex_filters = ['manufacturer.*legalName', 'manufacturer.*brandName', 'manufacturer.id'];
export const party_facet_field_list = ["legalName", "{LANG}_brandName", "businessType", "{LANG}_activitySectors", "{LANG}_businessKeywords", "{NULL}_origin", "circularEconomyCertificates","certificateType", "ppapComplianceLevel", "ppapDocumentType"];
export const party_filter_main = ["businessType", "activitySectors", "businessKeywords", "origin", "circularEconomyCertificates","certificateType", "ppapComplianceLevel", "ppapDocumentType"];
export const party_filter_trust = ["trustScore", "trustRating", "trustSellerCommunication", "trustFullfillmentOfTerms", "trustDeliveryPackaging", "trustNumberOfTransactions"];
export const item_manufacturer_id = "manufacturerId";
export const product_filter_trust = ["manufacturer.trustScore", "manufacturer.trustRating", "manufacturer.trustSellerCommunication", "manufacturer.trustFullfillmentOfTerms", "manufacturer.trustDeliveryPackaging", "manufacturer.trustNumberOfTransactions"];
export const product_filter_mappings = {
    "price": "Price",
    "currency": "Currency",
    "manufacturer.id": "Vendor ID",
    "manufacturer.businessType": "Business Type",
    "manufacturer.activitySectors": "Activity Sectors",
    "manufacturer.businessKeywords": "Business Keywords",
    "manufacturer.origin": "Vendor Origin",
    "businessType": "Business Type",
    "activitySectors": "Activity Sectors",
    "businessKeywords": "Business Keywords",
    "origin": "Vendor Origin"
};
export const product_nonfilter_full = ["_text_", "_version_", "id", "image", "localName", "languages", "doctype", "manufacturerId", "manufacturerItemId", "allLabels", "sparePart"];
export const product_nonfilter_regex = ["_baseQuantityUnit","_packageUnit", "lmf.", "manufacturer.", "_id", "_lowercaseLabel", "_txt", "_desc", "_label", "_key", "_price","_deliveryTime", "_currency", "httpwwwnimbleprojectorgresourceeclasshttpwwwnimbleprojectorgresourceeclasshttpwwwnimbleprojectorgresourceeclasshttpwwwnimbleprojectorgresourceeclass"];
export const product_nonfilter_data_type = []
export const product_configurable = [];
export const product_default = {};
export const facet_min = 1;
export const facet_count = -1;
export const query_settings = {
    "fields": ["STANDARD", "classification.allLabels", "{LANG}_label", "{LANG}_desc"],
    "boosting": true,
    "boostingFactors": {
        "STANDARD": 4,
        "classification.allLabels": 16,
        "{LANG}_label": 64,
        "{LANG}_desc": -1
    }
};
export const query_settings_comp = {
    "fields": ["STANDARD", "id", "legalName", "{LANG}_brandName"],
    "boosting": true,
    "boostingFactors": {
        "STANDARD": 4,
        "id": 4,
        "{LANG}_brandName": 64,
        "legalName": 64
    }
};

// Stripe publishable key
export const stripe_publishable_key = "pk_test_51Hqz4nIhfTtDDuPhnPfIRfdb7Wzg5ouRuKNxkxT90NlFSnFwNTKSUDAAXMSw15MLyk4LFJW5IJeFVAZ5biB1ksdB00a6ibmD7C";
