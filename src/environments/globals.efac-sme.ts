'use strict';

// Development variables

export const debug = false;


// Base path variables

export const base_path = "https://nimble.smecluster.com";
export const ub_base = "https://nimble.smecluster.com/ub-search";
export const idpURL = "http://nimble.smecluster.com:8080/auth/realms/master";
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
    "federationInstanceId": "EFACTORY",
    "platformName": "eFactory",
    "platformNameInMail":"NIMBLE",
    "envName": "efac",
    "addCartBehaviour": "single",
    "catalogExchangeEnabled": true,
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
        },
        "Aerospace": {
            "hiddenCategories": [],
            "logisticsCategory": "",
            "ontologyPrefix": "http://www.nimble-project.org/resource/aerospace#"
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
    "contractForCatalogueEnabled":true,
    "collaborationEnabled": false,
    "collapsiblePropertyFacets": false,
    "companyInformationInSearchResult": "BusinessType",
    "dataChannelsEnabled": false,
    "defaultBusinessProcessIds": [
    ],
    "defaultSearchIndex": "Name",
    "delegationEnabled": false,
    "demandsEnabled": false,
    "displayCategoryCounts":true,
    "displayProductIdInOverview": false,
    "docLink": "https://www.nimble-project.org/docs/",
    "emptyImage": "../assets/efpf_empty_img.png",
    "enableActionButtonsForTermsAndConditions":true,
    "enableOtherFiltersSearch": true,
    "enableStripePayment": true,
    "enableSubscriptions": true,
    "enableTenderAndBidManagementToolIntegration": true,
    "enableTermsAndConditionsAsFile": true,
    "faviconPath": "./assets/favicon.ico",
    "frameContractTabEnabled": true,
    "fundingDisclaimer": {
        "de": "Dieses Projekt wurde mit Mitteln aus dem Forschungs- und Innovationsprogramm Horizont 2020 der Europäischen Union unter der Fördervereinbarung Nr. 825075 gefördert.",
        "en": "This project has received funding from the European Union's Horizon 2020 research and innovation programme under grant agreement No 825075",
        "es": "Este proyecto ha recibido financiación del programa de investigación e innovación Horizon 2020 de la Unión Europea en virtud del acuerdo de subvención no 825075",
    },
    "hideContactInformationInCompanyDetails": false,
    "hideLogAnalytics": false,
    "hidePriceFunctionality": true,
    "hideTradeDetailsTab": false,
    "hideVisitStats": true,
    "imprint": {
        "en": "<table class='table table-borderless'><tr><td class='w-50 p-0 pr-3'><u>Platform Owner</u><br/><b>European Factory Foundation</b><br/>Lothringerstraße 14, 1030 Wien, Austria<br/>Phone: +43.1.7153.200<br/>E-Mail: <a href='mailto:info@efactoryfoundation.org'>info@efactoryfoundation.org</a></td><td class='w-50 p-0 pl-3'><u>Platform Provider</u><br/><b>SRDC Yazılım Araştırma ve Geliştirme ve Danışmanlık Ticaret Anonim Şirketi</b><br/>06800 Ankara, Turkey<br/>Phone: 90.312.210.18.37<br/>E-Mail: <a href='mailto:info@srdc.com.tr'>info@srdc.com.tr</a><br/>Internet: <a href='www.srdc.com.tr' target='_blank'>www.srdc.com.tr</a></td></tr></table>",
        "es": "<table class='table table-borderless'><tr><td class='w-50 p-0 pr-3'><u>Dueño de la Plataforma</u><br/><b>European Factory Foundation</b><br/>Lothringerstraße 14, 1030 Wien, Austria<br/>Teléfono: +43.1.7153.200<br/>Correo electrónico: <a href='mailto:info@efactoryfoundation.org'>info@efactoryfoundation.org</a></td><td class='w-50 p-0 pl-3'><u>Proveedor de Plataforma</u><br/><b>SRDC Yazılım Araştırma ve Geliştirme ve Danışmanlık Ticaret Anonim Şirketi</b><br/>06800 Ankara, Turkey<br/>Teléfono: 90.312.210.18.37<br/>Correo electrónico: <a href='mailto:info@srdc.com.tr'>info@srdc.com.tr</a><br/>Internet: <a href='www.srdc.com.tr' target='_blank'>www.srdc.com.tr</a></td></tr></table>",
        "de": "<table class='table table-borderless'><tr><td class='w-50 p-0 pr-3'><u>Eigentümer der Plattform</u><br/><b>European Factory Foundation</b><br/>Lothringerstraße 14, 1030 Wien, Austria<br/>Phone: +43.1.7153.200<br/>E-Mail: <a href='mailto:info@efactoryfoundation.org'>info@efactoryfoundation.org</a></td><td class='w-50 p-0 pl-3'><u>Plattform Anbieter</u><br/><b>SRDC Yazılım Araştırma ve Geliştirme ve Danışmanlık Ticaret Anonim Şirketi</b><br/>06800 Ankara, Turkey<br/>Phone: 90.312.210.18.37<br/>E-Mail: <a href='mailto:info@srdc.com.tr'>info@srdc.com.tr</a><br/>Internet: <a href='www.srdc.com.tr' target='_blank'>www.srdc.com.tr</a></td></tr></table>"
    },
    "invitationToPlatformEnabled": true,
    "kibanaConfig": {
        "companyDashboards": [],
        "companyGraphs": [],
        "dashboards": []
    },
    "kibanaEnabled": false,
    "languageSettings": {
        "available": ["en", "es", "de", "tr", "it", "sv"],
        "fallback": "en"
    },
    "loggingEnabled": false,
    "logoPath": "./assets/logo_efac.png",
    "federationLogoPath": "./assets/logo_mvp_efactory.png",
    "logoRequired": true,
    "networkEnabled": true,
    "nonPublicInformationFunctionalityEnabled": true,
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
        {
            id: "30_eom_10",
            name: "30 EOM 10",
            abbreviation: "E"
        },
        {
            id: "100_down_payment_with_po",
            name: "100% down payment with P/O",
            abbreviation: "E0"
        },
        {
            id: "30_days_net",
            name: "30 days net",
            abbreviation: "E1"
        },
        {
            id: "30_days_net_14_days_2_discount",
            name: "30 days net, 14 days 2% discount",
            abbreviation: "E2"
        },
        {
            id: "45_days_net",
            name: "45 days net",
            abbreviation: "E3"
        },
        {
            id: "prior_to_delivery",
            name: "Prior to delivery",
            abbreviation: "E4"
        },
        {
            id: "immediately_net",
            name: "Immediately net",
            abbreviation: "E5"
        },
        {
            id: "60_days_net",
            name: "60 days net",
            abbreviation: "E6"
        },
        {
            id: "confirmed_letter_of_credit",
            name: "Confirmed letter of credit",
            abbreviation: "E7"
        },
        {
            id: "50_down_payment_with_po",
            name: "50% down payment with P/O",
            abbreviation: "E8"
        },
        {
            id: "for_customs_purpose_only",
            name: "For customs purpose only",
            abbreviation: "E9"
        },
    ],
    "permanentWelcomeTab": false,
    "phoneNumberRequired": true,
    "productServiceFiltersEnabled":true,
    "productOfferingEnabled":true,
    "vatEnabled": false,
    "projectsEnabled": true,
    "replaceLegalRepresentativeWithCompanyAdmin": true,
    "requiredAgreements": [
        {
            "title": "EFPF Terms and Conditions",
            "src": "https://efpf-portal.ascora.eu/terms"
        }
    ],
    "separateFilterForCircularEconomyCertificatesInCompanySearch": false,
    "showChat": false,
    "showAgent": false,
    "showBusinessKeywordsInCompanyDetails":true,
    "showBusinessProcessBreakdownForPlatformAnalytics": false,
    "showCompanyMembers": true,
    "showCompanyDetailsInPlatformMembers":false,
    "showExplorative": false,
    "showFullName": false,
    "showGoogleTranslateOption": true,
    "showHomepage": false,
    "showLCPA": false,
    "showPPAP": false,
    "showTrack": false,
    "showTrade": false,
    "showTrustScore": true,
    "showVerification": false,
    "standardCurrency": "EUR",
    "standardTaxonomy": "FurnitureOntology",
    "supportedActivitySectors": {
        "": [],
        "Logistics Provider": [
            "Logistics Provider-General"
        ],
        "Manufacturer": [
            "Aerospace",
            "Bathroom",
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
            "Wooden Packaging"
        ],
        "Retailer": [
            "Retailer-General"
        ],
        "Service Provider": [
            "Aerospace",
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
            "Training",
            "Waste Management"
        ],
        "Supplier": [
            "Adhesives",
            "Aerospace",
            "Board",
            "Ceramic",
            "Composites",
            "Cork",
            "Decorated Paper",
            "Fitting",
            "Foam",
            "Glass",
            "Machinery",
            "Metal",
            "Packaging Materials",
            "Paints & Varnishes",
            "Plastic",
            "Plywood",
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
    "supportMail": "support@kolayam.co.uk",
    "supportMailContent": {
        "en": "Dear NIMBLE support team,\n\n\nI have encountered an issue.\n\nDescription of the issue:\n[Please insert a detailed description of the issue here. Add some screenshots as an attachment if they are of use.]",
        "es": "Equipo de soporte NIMBLE,\n\n\nHe detectado una incidencia.\n\nDescripción:\n[Por favor indique a continuación los detalles de la incidencia. Si es posible incluya alguna captura de pantalla si puede ser de utilidad.]",
        "de": "Sehr geehrtes NIMBLE-Supportteam,\n\n\nIch bin auf ein Problem gestoßen.\n\nBeschreibung des Problems:\n[Bitte geben Sie hier eine detaillierte Beschreibung des Problems ein. Fügen Sie einige Screenshots als Anhang hinzu, wenn nötig.]"
    },
    "showLoginFederation": true,
    "unshippedOrdersTabEnabled": true,
    "welcomeMessage":{
        "en": "Looks like you are new here.",
        "es": "Parece que eres nuevo aquí.",
        "de": "Sieht aus, als seien Sie neu hier.",
    },
    "whiteBlackListForCatalogue":true,
    "federationClientID": "efact-test-client",
    "federationIDP": "EFS",
    "smeFederationIDP": "SME",
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
export const product_filter_prod = ["freeOfCharge", "circularEconomyCertificates","certificateType", "applicableCountries", "customizable", "sparePart"];
export const product_filter_comp = ["manufacturer.legalName", "manufacturer.brandName", "manufacturer.businessType", "manufacturer.activitySectors", "manufacturer.businessKeywords", "manufacturer.origin", "manufacturer.circularEconomyCertificates","manufacturer.certificateType"];
export const party_identifying_regex_filters = ['manufacturer.*legalName', 'manufacturer.*brandName', 'manufacturer.id'];
export const party_facet_field_list = ["legalName", "{LANG}_brandName", "businessType", "{LANG}_activitySectors", "{LANG}_businessKeywords", "{NULL}_origin", "circularEconomyCertificates","certificateType"];
export const party_filter_main = ["businessType", "activitySectors", "businessKeywords", "origin", "circularEconomyCertificates","certificateType"];
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
export const product_nonfilter_full = ["_text_", "_version_", "id", "image", "localName", "languages", "doctype", "manufacturerId", "manufacturerItemId", "manufacturer.ppapComplianceLevel", "manufacturer.ppapDocumentType", "allLabels","permittedParties","restrictedParties"];
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
export const stripe_publishable_key = "pk_live_51Hqz4nIhfTtDDuPhnPel6fHYziCxcPLMEubqAcm3GREkyotTsfWdff5qnGZPEWbrSeUf5W6Bj05IFpGru917oz3600aWtJDSYt";
