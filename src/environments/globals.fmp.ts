'use strict';

// Development variables

export const debug = false;


// Base path variables

export const base_path = "https://fmp-nimble.salzburgresearch.at";
export const ub_base = "https://fmp-nimble.salzburgresearch.at/ub-search";
export const idpURL = "https://fmp-nimble.salzburgresearch.at:8080/auth/realms/master";
export const collab_path = "http://nimble.eu-de.containers.appdomain.cloud/collaborations";
export const pw_reset_link = idpURL + "/login-actions/reset-credentials?client_id=nimble_client";
export const frontendURL = base_path;


// Service endpoints

export const user_mgmt_endpoint = `${base_path}/api/identity`;
export const catalogue_endpoint = `${base_path}/api/catalog`;
export const catalogue_endpoint_with_zuul = `${base_path}/api/zuul/catalog`;
export const bpe_endpoint = `${base_path}/api/business-process`;
export const data_channel_endpoint = `${base_path}/api/data-channel`;
export const data_aggregation_endpoint = `${base_path}/api/data-aggregation`;
export const trust_service_endpoint = `${base_path}/api/trust`;
export const indexing_service_endpoint = `${base_path}/api/index`;
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
    "federationInstanceId": "FMP",
    "platformName": "FMP",
    "platformNameInMail":"NIMBLE",
    "envName": "fmp",
    "addCartBehaviour": "single",
    "catalogExchangeEnabled": false,
    "companyRegistrationRequired": true,
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
            'Corporate Carbon Footprint',
            'Due dilegence EUTR',
            'Chain of custody FSC',
            'Chain of custody PEFC'
        ],
        productCertificates: [
            'PEFC Certificate',
            'FSC Certificate',
            'Type I Ecolabel (ECO LABEL, NF Environment, Blue Angel, etc)',
            'Type III Ecolabel (Environmental Product Declaration / Product Footprint)',
            'Free of Hazardous Substances',
            'CITES licence',
            'FLEGT licence'
        ],
        indexField: "circularEconomyCertificates"
    },
    "contractForCatalogueEnabled":false,
    "collaborationEnabled": false,
    "collapsiblePropertyFacets": true,
    "companyInformationInSearchResult": "BusinessKeywords",
    "dataChannelsEnabled": false,
    "defaultBusinessProcessIds": [
        "Item_Information_Request",
        "Negotiation"
    ],
    "defaultSearchIndex": "Category",
    "delegationEnabled": false,
    "demandsEnabled": true,
    "displayCategoryCounts":false,
    "displayProductIdInOverview": true,
    "docLink": "https://www.nimble-project.org/docs_es/",
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
    "hideContactInformationInCompanyDetails": true,
    "hideLogAnalytics": true,
    "hidePriceFunctionality": false,
    "hideTradeDetailsTab": true,
    "hideVisitStats": true,
    "imprint": {
        "en": "<table class='table table-borderless'><tr><td class='w-50 p-0 pr-3'><u>Platform Owner</u><br/><b>AIDIMME - Technological Institute of Metalworking, Furniture, Wood, Packaging and Related sectors</b><br/>Technological Park, Benjamín Franklin Street 13<br/>46980 Paterna (Valencia), Spain<br/>Phone: +34.961.366.070<br/>E-Mail: <a href='mailto:info@aidimme.es'>info@aidimme.es</a><br/>CIF: G46261590</td><td class='w-50 p-0 pl-3'><u>Platform Provider</u><br/><b>Salzburg Research Forschungsgesellschaft m.b.H.</b><br/>Jakob Haringer Straße 5/3<br/>5020 Salzburg, Austria<br/>Phone: +43.662.2288.200<br/>Fax: +43.662.2288.222<br/>E-Mail: <a href='mailto:info@salzburgresearch.at'>info@salzburgresearch.at</a><br/>Internet: <a href='https://www.salzburgresearch.at' target='_blank'>www.salzburgresearch.at</a><br/>Managing Director: Siegfried Reich<br/>Registry Number: LG Salzburg (FN 149016 t)<br/>UID: ATU 41145408<br/>Content Officer: Siegfried Reich<br/>Owner: State of Salzburg (100%)</td></tr></table>",
        "es": "<table class='table table-borderless'><tr><td class='w-50 p-0 pr-3'><u>Dueño de la Plataforma</u><br/><b>AIDIMME - Instituto Tecnológico de la Metalmecánica, Muebles, Madera, Empaques y sectores relacionados</b><br/>Parque Tecnológico, Calle Benjamín Franklin 13<br/>46980 Paterna (Valencia), España<br/>Teléfono: +34.961.366.070<br/>Correo electrónico: <a href='mailto:info@aidimme.es'>info@aidimme.es</a><br/>CIF: G46261590</td><td class='w-50 p-0 pl-3'><u>Proveedor de Plataforma</u><br/><b>Salzburg Research Forschungsgesellschaft m.b.H.</b><br/>Jakob Haringer Straße 5/3<br/>5020 Salsburgo, Austria<br/>Teléfono: +43.662.2288.200<br/>Fax: +43.662.2288.222<br/>Correo electrónico: <a href='mailto:info@salzburgresearch.at'>info@salzburgresearch.at</a><br/>Internet: <a href='https://www.salzburgresearch.at' target='_blank'>www.salzburgresearch.at</a><br/>Director Gerente: Siegfried Reich<br/>Numero de registro: LG Salzburg (FN 149016 t)<br/>UID: ATU 41145408<br/>Oficial de Contenido: Siegfried Reich<br/>Propietario: State of Salzburg (100%)</td></tr></table>"
    },
    "invitationToPlatformEnabled": false,
    "kibanaConfig": {
        "companyDashboards": [],
        "companyGraphs": [],
        "dashboards": [
            {
                "title": "User Logins & Registrations",
                "url": "#/dashboard/f1ab15d0-cda5-11e9-b692-35aea039cd0a?embed=true&_g=(refreshInterval%3A(pause%3A!t%2Cvalue%3A0)%2Ctime%3A(from%3Anow%2FM%2Cmode%3Aquick%2Cto%3Anow%2FM))"
            }, {
                "title": "Business Process Activities",
                "url": "#/dashboard/7e864f20-cda5-11e9-b692-35aea039cd0a?embed=true&_g=(refreshInterval%3A(pause%3A!t%2Cvalue%3A0)%2Ctime%3A(from%3Anow%2FM%2Cmode%3Aquick%2Cto%3Anow%2FM))"
            }, {
                "title": "Products Activities",
                "url": "#/dashboard/bae8fd00-cda5-11e9-b692-35aea039cd0a?embed=true&_g=(refreshInterval%3A(pause%3A!t%2Cvalue%3A0)%2Ctime%3A(from%3Anow%2FM%2Cmode%3Aquick%2Cto%3Anow%2FM))"
            }
        ]
    },
    "kibanaEnabled": true,
    "languageSettings": {
        "available": ["en", "es"],
        "fallback": "en"
    },
    "loggingEnabled": true,
    "logoPath": "./assets/logo_fmp.png",
    "federationLogoPath": "./assets/logo_mvp_efactory.png",
    "logoRequired": true,
    "networkEnabled": false,
    "nonPublicInformationFunctionalityEnabled": false,
    "paymentMeans": [
        "Credit Card",
        "ACH Transfer",
        "Transfer",
        "Direct debit",
        "Bank check",
        "Check / Promissory note",
        "Confirming",
        "Cash",
        "Paypal",
        "Bizum"
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
            id: "Cash_on_delivery",
            name: "Cash on delivery",
            abbreviation: "COD"
        },
        {
            id: "Payment_in_cash",
            name: "Payment in cash",
            abbreviation: "PIC"
        },
        {
            id: "Deferred_payment",
            name: "Deferred payment",
            abbreviation: ""
        },
    ],
    "permanentWelcomeTab": true,
    "phoneNumberRequired": true,
    "productServiceFiltersEnabled":false,
    "productOfferingEnabled":false,
    "vatEnabled": false,
    "projectsEnabled": true,
    "replaceLegalRepresentativeWithCompanyAdmin": false,
    "requiredAgreements": [
        {
            "title": "Privacy Policy",
            "src": "./assets/privacy_policy.pdf"
        },
        {
            "title": "Terms of Service (ToS)",
            "src": "./assets/tos.pdf"
        }
    ],
    "separateFilterForCircularEconomyCertificatesInCompanySearch": true,
    "showChat": false,
    "showAgent": false,
    "showBusinessKeywordsInCompanyDetails":false,
    "showBusinessProcessBreakdownForPlatformAnalytics": true,
    "showCompanyMembers": true,
    "showCompanyDetailsInPlatformMembers":true,
    "showExplorative": false,
    "showFullName": true,
    "showGoogleTranslateOption": false,
    "showHomepage": true,
    "showLCPA": false,
    "showPPAP": false,
    "showTrack": false,
    "showTrade": false,
    "showTrustScore": false,
    "showVerification": false,
    "standardCurrency": "EUR",
    "standardTaxonomy": "FurnitureOntology",
    "supportedActivitySectors": {
        "": [],
        "Logistics Provider": [
            "Logistics Provider-General"
        ],
        "Manufacturer": [
            "Accessories",
            "Bathroom",
            "Building",
            "Carpentry",
            "Childcare",
            "Closet / Cupboard",
            "Manufacturer-Contract",
            "Doors / Windows",
            "Furniture for Retail",
            "Home",
            "Hotels, Restaurants & Cafes",
            "Kids",
            "Kitchen",
            "Lightings / Lamps",
            "Mattresses",
            "Office",
            "Outdoor Furniture",
            "Panels",
            "Parquet Floors",
            "Upholstered Furniture",
            "Wooden Packaging",
            "Wooden Structures"
        ],
        "Retailer": [
            "Retailer-General"
        ],
        "Service Provider": [
            "Architects",
            "Buyer-Designer",
            "Certification",
            "Consulting",
            "Design / Decoration",
            "Distributor",
            "Engineering",
            "Facility Cleaning",
            "Facility Maintenance",
            "Furniture Installer",
            "Legal Services",
            "Outsourcing",
            "Print Services",
            "Quality Control / Tests",
            "Sales Agent",
            "Software",
            "Training",
            "Waste Management"
        ],
        "Supplier": [
            "Abrasives",
            "Adhesives",
            "Board",
            "Ceramic",
            "Composites",
            "Cork",
            "Decorated Paper",
            "Electronic Components",
            "Fitting",
            "Foam",
            "Glass",
            "Machinery",
            "Metal",
            "Packaging Materials",
            "Paints & Varnishes",
            "Plastic",
            "Plywood",
            "Security elements",
            "Straw",
            "Textile",
            "Tools",
            "Veneer",
            "Wood"
        ]
    },
    "supportedBusinessTypes": [
        "",
        "Logistics Provider",
        "Manufacturer",
        "Retailer",
        "Service Provider",
        "Supplier"
    ],
    "supportedCertificates": [
        "Health and Safety",
        "Innovation",
        "Management",
        "Quality",
        "Sustainability and Environment",
        "Other"
    ],
    "supportedRoles": [
        "legal_representative",
        "monitor",
        "publisher",
        "purchaser",
        "sales_officer"
    ],
    "supportMail": "nimbleFMP@aidimme.es",
    "supportMailContent": {
        "en": "Dear NIMBLE support team,\n\n\nI have encountered an issue.\n\nDescription of the issue:\n[Please insert a detailed description of the issue here. Add some screenshots as an attachment if they are of use.]",
        "es": "Equipo de soporte NIMBLE,\n\n\nHe detectado una incidencia.\n\nDescripción:\n[Por favor indique a continuación los detalles de la incidencia. Si es posible incluya alguna captura de pantalla si puede ser de utilidad.]"
    },
    "showLoginFederation": false,
    "unshippedOrdersTabEnabled": false,
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
        "enabled": true,
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
export const product_filter_prod = ["freeOfCharge", "circularEconomyCertificates", "applicableCountries", "customizable"];
export const product_filter_comp = [ "manufacturer.brandName", "manufacturer.origin","manufacturer.circularEconomyCertificates"];
export const party_identifying_regex_filters = ['manufacturer.*legalName', 'manufacturer.*brandName', 'manufacturer.id'];
export const party_facet_field_list = ["legalName", "{LANG}_brandName", "businessType", "{LANG}_activitySectors", "{LANG}_businessKeywords", "{NULL}_origin", "circularEconomyCertificates"];
export const party_filter_main = ["activitySectors", "origin", "circularEconomyCertificates"];
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
export const product_nonfilter_full = ["_text_", "_version_", "id", "image", "localName", "languages", "doctype", "manufacturerId", "manufacturerItemId", "manufacturer.ppapComplianceLevel", "manufacturer.ppapDocumentType", "allLabels", "sparePart"];
export const product_nonfilter_regex = ["_baseQuantityUnit","_packageUnit", "lmf.", "manufacturer.", "_id", "_lowercaseLabel", "_txt", "_desc", "_label", "_key", "_price", "_deliveryTime","_currency", "httpwwwnimbleprojectorgresourceeclasshttpwwwnimbleprojectorgresourceeclasshttpwwwnimbleprojectorgresourceeclasshttpwwwnimbleprojectorgresourceeclass","baseQuantity","items_package","_deliveryTime"];
export const product_nonfilter_data_type = ["string","double","price","deliveryPeriod"]
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
        "{LANG}_brandName": 32,
        "legalName": 64
    }
};

// Stripe publishable key
export const stripe_publishable_key = "pk_test_51Hqz4nIhfTtDDuPhnPfIRfdb7Wzg5ouRuKNxkxT90NlFSnFwNTKSUDAAXMSw15MLyk4LFJW5IJeFVAZ5biB1ksdB00a6ibmD7C";
