'use strict';

// Development variables

export const debug = false;


// Base path variables

export const base_path = "http://nimble-staging-neu.salzburgresearch.at";
export const ub_base = "http://nimble-staging-neu.salzburgresearch.at/search";
export const idpURL = "http://nimble-staging-neu.salzburgresearch.at:8080/auth/realms/master";
export const collab_path = "http://nimble.eu-de.containers.appdomain.cloud/collaborations";
export const pw_reset_link = idpURL + "/login-actions/reset-credentials?client_id=nimble_client";
export const frontendURL = base_path + "/efpf/frontend/";


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
export const eFactory_indexing_endpoint = "https://efpf-security-portal.salzburgresearch.at/api/index";

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


// Platform Configuration

export const config = {
    "federationInstanceId": "STAGING",
    "platformName": "eFactory Staging",
    "platformNameInMail":"NIMBLE",
    "envName": "efac-staging",
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
    "contractForCatalogueEnabled":true,
    "collaborationEnabled": false,
    "collapsiblePropertyFacets": false,
    "companyInformationInSearchResult": "BusinessType",
    "dataChannelsEnabled": false,
    "defaultBusinessProcessIds": [
    ],
    "delegationEnabled": true,
    "displayCategoryCounts":true,
    "docLink": "https://www.nimble-project.org/docs/",
    "faviconPath": "./assets/favicon.ico",
    "hideLogAnalytics": false,
    "hidePriceFunctionality": true,
    "hideTradeDetailsTab": false,
    "hideVisitStats": false,
    "imprint": {
        "en": "<table class='table table-borderless'><tr><td class='w-50 p-0 pr-3'><u>Platform Owner</u><br/><b>AIDIMME - Technological Institute of Metalworking, Furniture, Wood, Packaging and Related sectors</b><br/>Technological Park, Benjamín Franklin Street 13<br/>46980 Paterna (Valencia), Spain<br/>Phone: +34.961.366.070<br/>E-Mail: <a href='mailto:info@aidimme.es'>info@aidimme.es</a><br/>CIF: G46261590</td><td class='w-50 p-0 pl-3'><u>Platform Provider</u><br/><b>Salzburg Research Forschungsgesellschaft m.b.H.</b><br/>Jakob Haringer Straße 5/3<br/>5020 Salzburg, Austria<br/>Phone: +43.662.2288.200<br/>Fax: +43.662.2288.222<br/>E-Mail: <a href='mailto:info@salzburgresearch.at'>info@salzburgresearch.at</a><br/>Internet: <a href='https://www.salzburgresearch.at' target='_blank'>www.salzburgresearch.at</a><br/>Managing Director: Siegfried Reich<br/>Registry Number: LG Salzburg (FN 149016 t)<br/>UID: ATU 41145408<br/>Content Officer: Siegfried Reich<br/>Owner: State of Salzburg (100%)</td></tr></table>",
        "es": "<table class='table table-borderless'><tr><td class='w-50 p-0 pr-3'><u>Dueño de la Plataforma</u><br/><b>AIDIMME - Instituto Tecnológico de la Metalmecánica, Muebles, Madera, Empaques y sectores relacionados</b><br/>Parque Tecnológico, Calle Benjamín Franklin 13<br/>46980 Paterna (Valencia), España<br/>Teléfono: +34.961.366.070<br/>Correo electrónico: <a href='mailto:info@aidimme.es'>info@aidimme.es</a><br/>CIF: G46261590</td><td class='w-50 p-0 pl-3'><u>Proveedor de Plataforma</u><br/><b>Salzburg Research Forschungsgesellschaft m.b.H.</b><br/>Jakob Haringer Straße 5/3<br/>5020 Salsburgo, Austria<br/>Teléfono: +43.662.2288.200<br/>Fax: +43.662.2288.222<br/>Correo electrónico: <a href='mailto:info@salzburgresearch.at'>info@salzburgresearch.at</a><br/>Internet: <a href='https://www.salzburgresearch.at' target='_blank'>www.salzburgresearch.at</a><br/>Director Gerente: Siegfried Reich<br/>Numero de registro: LG Salzburg (FN 149016 t)<br/>UID: ATU 41145408<br/>Oficial de Contenido: Siegfried Reich<br/>Propietario: State of Salzburg (100%)</td></tr></table>"
    },
    "kibanaConfig": {
        "companyDashboards": [
            {
                "title": "Company Visits",
                "url": "#/dashboard/d1503680-e5bf-11e9-a14e-bde7739ac822?embed=true&_g=(refreshInterval:(pause:!t,value:0),time:(from:now-1y,mode:quick,to:now))&_a=(filters:!(('$state':(store:appState),meta:(alias:!n,disabled:!f,index:'7e688530-cd69-11e9-b5e8-e908493e1aa7',key:companyId,negate:!f,params:(query:'41915',type:phrase),type:phrase,value:'41915'),query:(match:(companyId:(query:'41915',type:phrase))))))"
            },
            {
                "title": "Product / Service Visits",
                "url": "#/dashboard/d7b241a0-e5d1-11e9-a14e-bde7739ac822?embed=true&_g=(refreshInterval:(pause:!t,value:0),time:(from:now-1y,mode:quick,to:now))&_a=(description:'',filters:!(('$state':(store:appState),meta:(alias:!n,disabled:!f,index:'7e688530-cd69-11e9-b5e8-e908493e1aa7',key:manufactured_companyId.keyword,negate:!f,params:(query:'41915',type:phrase),type:phrase,value:'41915'),query:(match:(manufactured_companyId.keyword:(query:'41915',type:phrase))))))"
            }
        ],
        "companyGraphs": [
            {
                "title": "Product / Service Category",
                "url": "#/visualize/edit/76aff780-e5d1-11e9-a14e-bde7739ac822?embed=true&_g=(refreshInterval:(pause:!t,value:0),time:(from:now-1y,mode:quick,to:now))&_a=(filters:!(('$state':(store:appState),meta:(alias:!n,disabled:!f,index:'7e688530-cd69-11e9-b5e8-e908493e1aa7',key:manufactured_companyId,negate:!f,params:(query:'41915',type:phrase),type:phrase,value:'41915'),query:(match:(manufactured_companyId:(query:'41915',type:phrase))))))"
            },
            {
                "title": "Product / Service Category Filter",
                "url": "#/visualize/edit/8d916fd0-e5de-11e9-a14e-bde7739ac822?embed=true&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-1y,mode:quick,to:now))&_a=(filters:!(('$state':(store:appState),meta:(alias:'Select+Category',disabled:!t,index:'7e688530-cd69-11e9-b5e8-e908493e1aa7',key:category.keyword,negate:!f,params:(query:'Auxiliary+supply,+additive,+cleaning+agent',type:phrase),type:phrase,value:'Auxiliary+supply,+additive,+cleaning+agent'),query:(match:(category.keyword:(query:'Auxiliary+supply,+additive,+cleaning+agent',type:phrase)))),('$state':(store:appState),meta:(alias:!n,disabled:!f,index:'7e688530-cd69-11e9-b5e8-e908493e1aa7',key:manufactured_companyId,negate:!f,params:(query:'41915',type:phrase),type:phrase,value:'41915'),query:(match:(manufactured_companyId:(query:'41915',type:phrase))))),linked:!f,query:(language:lucene,query:'activity:+%22product_visit%22'),uiState:(vis:(params:(sort:(columnIndex:1,direction:!n)))),vis:(aggs:!((enabled:!t,id:'1',params:(),schema:metric,type:count),(enabled:!t,id:'2',params:(customLabel:'Company+Name',field:active_company.keyword,missingBucket:!f,missingBucketLabel:Missing,order:desc,orderBy:'1',otherBucket:!f,otherBucketLabel:Other,size:5),schema:bucket,type:terms),(enabled:!t,id:'3',params:(customLabel:Category,field:category.keyword,missingBucket:!f,missingBucketLabel:Missing,order:desc,orderBy:'1',otherBucket:!f,otherBucketLabel:Other,size:5),schema:bucket,type:terms)),params:(perPage:10,showMetricsAtAllLevels:!f,showPartialRows:!f,showTotal:!f,sort:(columnIndex:1,direction:!n),totalFunc:sum),title:'Product%2FService+By+Category',type:table))",
            }
        ],
        "dashboards": [
            {
                "title": "User Logins & Registrations",
                "url": "#/dashboard/5d41a2b0-cd6e-11e9-b5e8-e908493e1aa7?embed=true&_g=(refreshInterval%3A(pause%3A!t%2Cvalue%3A0)%2Ctime%3A(from%3Anow%2FM%2Cmode%3Aquick%2Cto%3Anow%2FM))"
            }, {
                "title": "Business Process Activities",
                "url": "#/dashboard/548c5e20-cd6f-11e9-b5e8-e908493e1aa7?embed=true&_g=(refreshInterval%3A(pause%3A!t%2Cvalue%3A0)%2Ctime%3A(from%3Anow%2FM%2Cmode%3Aquick%2Cto%3Anow%2FM))"
            }, {
                "title": "Products Activities",
                "url": "#/dashboard/48ed8e30-cd70-11e9-b5e8-e908493e1aa7?embed=true&_g=(refreshInterval%3A(pause%3A!t%2Cvalue%3A0)%2Ctime%3A(from%3Anow%2FM%2Cmode%3Aquick%2Cto%3Anow%2FM))"
            },
            {
                "title": "Product / Service Visits",
                "url": "#/dashboard/3296ca60-ec07-11e9-a14e-bde7739ac822?embed=true&_g=(refreshInterval:(pause:!t,value:0),time:(from:now-1y,mode:quick,to:now))&_a=(description:'',filters:!(),fullScreenMode:!f,options:(darkTheme:!f,hidePanelTitles:!f,useMargins:!t),panels:!((embeddableConfig:(),gridData:(h:11,i:'1',w:14,x:0,y:0),id:b0b3cdd0-e5d1-11e9-a14e-bde7739ac822,panelIndex:'1',type:visualization,version:'6.7.1'),(embeddableConfig:(),gridData:(h:11,i:'4',w:10,x:14,y:0),id:'699fc8d0-e5c8-11e9-a14e-bde7739ac822',panelIndex:'4',type:visualization,version:'6.7.1'),(embeddableConfig:(),gridData:(h:11,i:'5',w:10,x:24,y:0),id:'680d45d0-ec06-11e9-a14e-bde7739ac822',panelIndex:'5',type:visualization,version:'6.7.1'),(embeddableConfig:(),gridData:(h:11,i:'6',w:14,x:34,y:0),id:'0d278210-ec07-11e9-a14e-bde7739ac822',panelIndex:'6',type:visualization,version:'6.7.1')),query:(language:lucene,query:''),timeRestore:!f,title:'Platform+Visits+Dashboard',viewMode:view)"
            },
            {
                "title": "Company Visits",
                "url": "#/dashboard/a6b560c0-ec0f-11e9-a14e-bde7739ac822?embed=true&_g=(refreshInterval:(pause:!t,value:0),time:(from:now-1y,mode:quick,to:now))&_a=(description:'',filters:!(),fullScreenMode:!f,options:(darkTheme:!f,hidePanelTitles:!f,useMargins:!t),panels:!((embeddableConfig:(),gridData:(h:11,i:'1',w:24,x:0,y:0),id:ef9d04f0-e520-11e9-a14e-bde7739ac822,panelIndex:'1',type:visualization,version:'6.7.1'),(embeddableConfig:(),gridData:(h:11,i:'2',w:24,x:24,y:0),id:ff5d3930-e5bd-11e9-a14e-bde7739ac822,panelIndex:'2',type:visualization,version:'6.7.1')),query:(language:lucene,query:''),timeRestore:!f,title:'Platform+Company+Visits',viewMode:view)"
            }
        ]
    },
    "kibanaEnabled": true,
    "languageSettings": {
        "available": ["en", "es", "de", "tr", "it", "sv"],
        "fallback": "en"
    },
    "loggingEnabled": true,
    "logoPath": "./assets/logo_efpf.png",
    "federationLogoPath": "./assets/logo_mvp_efactory.png",
    "logoRequired": true,
    "networkEnabled": true,
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
    "showChat": false,
    "showAgent": false,
    "showBusinessKeywordsInCompanyDetails":true,
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
    "defaultSearchIndex": "Products",
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
    "supportMail": "support@efactory-project.eu",
    "supportMailContent": {
        "en": "Dear NIMBLE support team,\n\n\nI have encountered an issue.\n\nDescription of the issue:\n[Please insert a detailed description of the issue here. Add some screenshots as an attachement if they are of use.]",
        "es": "Equipo de soporte NIMBLE,\n\n\nHe detectado una incidencia.\n\nDescripción:\n[Por favor indique a continuación los detalles de la incidencia. Si es posible incluya alguna captura de pantalla si puede ser de utilidad.]"
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
export const product_currency = "currency";
export const product_cat = "classificationUri";
export const product_cat_mix = "commodityClassficationUri";
export const product_filter_prod = ["freeOfCharge", "certificateType", "applicableCountries", "customizable", "sparePart"];
export const product_filter_comp = ["manufacturer.legalName", "manufacturer.brandName", "manufacturer.businessType", "manufacturer.activitySectors", "manufacturer.businessKeywords", "manufacturer.origin", "manufacturer.certificateType"];
export const party_identifying_regex_filters = ['manufacturer.*legalName', 'manufacturer.*brandName', 'manufacturer.id'];
export const party_facet_field_list = ["legalName", "{LANG}_brandName", "businessType", "{LANG}_activitySectors", "{LANG}_businessKeywords", "{NULL}_origin", "{NULL}_certificateType"];
export const party_filter_main = ["businessType", "activitySectors", "businessKeywords", "origin", "certificateType"];
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
export const product_nonfilter_full = ["_text_", "_version_", "id", "image", "localName", "languages", "doctype", "manufacturerId", "manufacturerItemId", "manufacturer.ppapComplianceLevel", "manufacturer.ppapDocumentType", "allLabels"];
export const product_nonfilter_regex = ["lmf.", "manufacturer.", "_id", "_lowercaseLabel", "_txt", "_desc", "_label", "_key", "_price", "_currency", "httpwwwnimbleprojectorgresourceeclasshttpwwwnimbleprojectorgresourceeclasshttpwwwnimbleprojectorgresourceeclasshttpwwwnimbleprojectorgresourceeclass"];
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
