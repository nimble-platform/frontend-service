'use strict';

/*
 * Copyright 2020
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
   In collaboration with
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
 * AIDIMME - Technological Institute of Metalworking, Furniture, Wood, Packaging and Related sectors; Valencia; Spain
 * UB - University of Bremen, Faculty of Production Engineering; Bremen; Germany
 * BIBA - Bremer Institut für Produktion und Logistik GmbH; Bremen; Germany
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

// Development variables

// Boolean flag if debug information shall be shown on the console
export const debug = false;


// Base path variables

// Platform base path of backend services
export const base_path = "http://nimble-staging.salzburgresearch.at";
// Base path of explorative search endpoints
export const ub_base = "http://nimble-staging.salzburgresearch.at/search";
// Base path of Keycloak IDP
export const idpURL = "http://nimble-staging.salzburgresearch.at:8080/auth/realms/master";
// Base path of collaboration tools endpoints
export const collab_path = "http://nimble.eu-de.containers.appdomain.cloud/collaborations";
// Link to Keycloak password reset
export const pw_reset_link = idpURL + "/login-actions/reset-credentials?client_id=nimble_client";
// Path where this UI is hosted
export const frontendURL = base_path + "/frontend/";


// Service endpoints

export const user_mgmt_endpoint = `${base_path}/identity`;
export const catalogue_endpoint = `${base_path}/catalog`;
export const bpe_endpoint = `${base_path}/business-process`;
export const data_channel_endpoint = `${base_path}/data-channel`;
export const data_aggregation_endpoint = `${base_path}/data-aggregation`;
export const trust_service_endpoint = `${base_path}/trust`;
export const indexing_service_endpoint = `${base_path}/index`;
export const rocketChatEndpoint = `${base_path}:3000`;
export const logstash_endpoint = `${base_path}/logstash`;
export const kibana_endpoint = `${base_path}/kibana/app/kibana`;
export const delegate_endpoint = `${base_path}/delegate`;
export const agent_mgmt_endpoint = `http://159.69.214.42/agents`;
export const collaboration_endpoint = `${collab_path}`;
export const certificate_of_origin_endpoint = `http://161.156.70.125:7695`;
export const legislation_endpoint = `http://77.230.101.223/nimsys`;


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
/*
- federationInstanceId: ID of this instance - should match the backend configuration
- platformName: Readable name of this instance - to be displayed on the navbar
- platformNameInMail: Name of the instance - to be used in the mail subject/body
- envName: Short name of the current environment
- addCartBehaviour: If "single" a product can be added to the shopping cart once, if "multiple" it can be added multiple times
- companyRegistrationRequired: Boolean flag if users need to register (or be assigned to) a company before using any platform feature
- categoryFilter: Allows configuring the usage of different ontologies. The key is the ontology name, the value is a JSON object with the following entries:
	* hiddenCategories: An array of top-level category IDs that will be hidden from the UI
	* logisticsCategory: The ID of the logistics categoryFilter
	* ontologyPrefix: The prefix of the ontology used to identify it
- collaborationEnabled: Boolean flag if the collaboration feature is enabled in the dashboard (textile use case)
- collapsiblePropertyFacets: Boolean flag if the property facets are collapsible or not
- dataChannelsEnabled: Boolean flag if data channels shall be supported
- defaultBusinessProcessIds: Array of default business processes that shall be enabled for a company upon registration. Applicable values are "Item_Information_Request", "Ppap", "Negotiation", "Order", "Transport_Execution_Plan" and "Fulfilment". An empty array enables all processes
- defaultSearchIndex: If "Name" the product search query prioritizes the product name, if "Category" it prioritizes the category name
- delegationEnabled: Boolean flag if the federation feature is available for the instance
- displayCategoryCounts: Boolean flag if the category counts are displayed in the category filter. If it's false, then we show the count only for the selected category.
- docLink: Link to the documentation resources
- frameContractEnabled: Boolean flag is frame contracts are applicable
- imprint: HTML string of the imprint information to be shown on the according subpage
- kibanaConfig: Allows configuring the titles and links to the Kibana dashboards. The keys are "companyDashboards" (Basic company information), "companyGraphs" (More complex company information) and "dashboards" (Platform information), this value is an array of JSON objects with the following entries:
	* title: Title to be displayed on the UI
	* url: Sub-URL of the Kibana page starting at "#"
- kibanaEnabled: Boolean flag if Kibana is used on the instance
- languageSettings: Allows configuring the languages on the instance. The JSON object uses the following structure:
	* available: Array of ISO language codes available for selection on the platform. Make sure to include an according JSON file for each language in "src/assets/i18n"
	* fallback: The language to be used in case a translation for the current user selection is unavailble
- loggingEnabled: Boolean flag if the logstash endpoint shall be used for tracking user activity
- logoPath: Link to the logo disabled in the navbar
- federationLogoPath: Link to the logo of the federated login
- logoRequired: Boolean flag if the submission of a company logo is required upon registration
- permanentWelcomeTab: Boolean flag if the welcome page is permanent
- phoneNumberRequired: Boolean flag if the phone number of a user is required upon registration
- productServiceFiltersEnabled: Boolean flag if there is a separate filter for the product/service properties
- vatEnabled: Boolean flag if VAT rates shall be included in price calculations
- projectsEnabled: Boolean flag if project management is available on the dashboard
- requiredAgreements: Array of JSON objects defining the terms a user has to agree to upon registration. Each entry uses the following structure:
	* title: Title to be displayed on the UI
	* src: Link to the agreement document
- showChat: Boolean flag if the chat is available on the instance
- showAgent: Boolean flag if the agent configuration is available on the instance
- showCompanyMembers: Boolean flag if all company members shall be eligible to see the list of company members
- showCompanyDetailsInPlatformMembers: Boolean flag if the company details are shown when the company is selected in platform members page
- showExplorative: Boolean flag if the explorative search feature is enabled on the instance
- showFullName: Boolean flag if the full name of a user is shown in the navbar
- showLCPA: Boolean flag if LCPA codes shall be linkable to products
- showPPAP: Boolean flag if information regarding the PPAP process is enabled on the instance
- showTrack: Boolean flag if the Track & Trace feature is enabled on the instance
- showTrade: Boolean flag if advanced trade detail information shall be configurable in the company settings
- showVerification: Boolean flag if additional verification information can be submitted upon registration
- standardCurrency: Default currency to use on the instance. Applicable values are "EUR", "SEK" and "USD"
- standardTaxonomy: Default taxonomy to use during product publishing. Applicable values are "All" (search over all defined taxonomies) or any taxonomy name
- supportedActivitySectors: Allows configuring a pre-defined selection of activity sectors for a company. The key is "" or any of the business types listed in "supportedBusinessTypes" and the value is a JSON object of usable strings and their translations. In case of an empty object free text is allowed as input
- supportedBusinessTypes: An array of pre-defined business types usable during company registration
- supportedCertificates: An array of pre-defined certificate types usable during document upload
- supportedRoles: An array of roles supported when inviting new company members. Applicable values are "company_admin", "external_representative", "legal_representative", "monitor", "publisher", "purchaser" and "sales_officer"
- supportMail: The email address used for sending any support, change or deletion requests
- supportMailContent: Allows defining the default body of a support mail. Keys are the ISO language codes and values are the strings displayed in the mail body (use \n for linebreaks)
- showLoginFederation: Boolean flag if the federated login is available on the instance
- unshippedOrdersTabEnabled: Boolean flag is the unshipped orders shall be shown on the dashboard
- welcomeMessage: Message displayed in the welcome page
- federationClientID: Keycloak client ID used for the federated login
- federationIDP: Keycloak IDP used for the federated login
- legislationSettings: Allows to toggle the legislation feature and define its relevant settings (furniture use case)
- demo: Allows to toggle demo account functionality and its relevant settings on the login page
*/

export const config = {
    "federationInstanceId": "STAGING",
    "platformName": "Local Development",
    "platformNameInMail":"NIMBLE",
    "envName": "local",
    "addCartBehaviour": "single",
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
    "collaborationEnabled": false,
    "collapsiblePropertyFacets": false,
    "dataChannelsEnabled": true,
    "defaultBusinessProcessIds": [
    ],
    "defaultSearchIndex": "Name",
    "delegationEnabled": true,
    "displayCategoryCounts":true,
    "docLink": "https://www.nimble-project.org/docs/",
    "frameContractTabEnabled": true,
    "imprint": {
        "en": "<u>Platform Owner & Provider</u><br/><b>Salzburg Research Forschungsgesellschaft m.b.H.</b><br/>Jakob Haringer Straße 5/3<br/>5020 Salzburg, Austria<br/>Phone: +43.662.2288.200<br/>Fax: +43.662.2288.222<br/>E-Mail: <a href='mailto:info@salzburgresearch.at'>info@salzburgresearch.at</a><br/>Internet: <a href='https://www.salzburgresearch.at' target='_blank'>www.salzburgresearch.at</a><br/>Managing Director: Siegfried Reich<br/>Registry Number: LG Salzburg (FN 149016 t)<br/>UID: ATU 41145408<br/>Content Officer: Siegfried Reich<br/>Owner: State of Salzburg (100%)",
        "es": "<u>Propietario de Plataforma y Proveedor</u><br/><b>Salzburg Research Forschungsgesellschaft m.b.H.</b><br/>Jakob Haringer Straße 5/3<br/>5020 Salsburgo, Austria<br/>Teléfono: +43.662.2288.200<br/>Fax: +43.662.2288.222<br/>Correo electrónico: <a href='mailto:info@salzburgresearch.at'>info@salzburgresearch.at</a><br/>Internet: <a href='https://www.salzburgresearch.at' target='_blank'>www.salzburgresearch.at</a><br/>Director Gerente: Siegfried Reich<br/>Numero de Registro: LG Salzburg (FN 149016 t)<br/>UID: ATU 41145408<br/>Oficial de Contenido: Siegfried Reich<br/>Propietario: State of Salzburg (100%)"
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
                "url": "#/visualize/edit/8d916fd0-e5de-11e9-a14e-bde7739ac822?embed=true&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-1y,mode:quick,to:now))&_a=(filters:!(('$state':(store:appState),meta:(alias:'Select+Category',disabled:!t,index:'7e688530-cd69-11e9-b5e8-e908493e1aa7',key:category.keyword,negate:!f,params:(query:'Auxiliary+supply,+additive,+cleaning+agent',type:phrase),type:phrase,value:'Auxiliary+supply,+additive,+cleaning+agent'),query:(match:(category.keyword:(query:'Auxiliary+supply,+additive,+cleaning+agent',type:phrase)))),('$state':(store:appState),meta:(alias:!n,disabled:!f,index:'7e688530-cd69-11e9-b5e8-e908493e1aa7',key:manufactured_companyId,negate:!f,params:(query:'41915',type:phrase),type:phrase,value:'41915'),query:(match:(manufactured_companyId:(query:'41915',type:phrase))))),linked:!f,query:(language:lucene,query:'activity:+%22product_visit%22'),uiState:(vis:(params:(sort:(columnIndex:1,direction:!n)))),vis:(aggs:!((enabled:!t,id:'1',params:(),schema:metric,type:count),(enabled:!t,id:'2',params:(customLabel:'Company+Name',field:active_company.keyword,missingBucket:!f,missingBucketLabel:Missing,order:desc,orderBy:'1',otherBucket:!f,otherBucketLabel:Other,size:5),schema:bucket,type:terms),(enabled:!t,id:'3',params:(customLabel:Category,field:category.keyword,missingBucket:!f,missingBucketLabel:Missing,order:desc,orderBy:'1',otherBucket:!f,otherBucketLabel:Other,size:5),schema:bucket,type:terms)),params:(perPage:10,showMetricsAtAllLevels:!f,showPartialRows:!f,showTotal:!f,sort:(columnIndex:1,direction:!n),totalFunc:sum),title:'Product%2FService+By+Category',type:table))"
            }
        ],
        "dashboards": [
            {
                "title": "User Logins & Registrations",
                "url": "#/dashboard/5d41a2b0-cd6e-11e9-b5e8-e908493e1aa7?embed=true&_g=(refreshInterval:(pause:!t,value:0),time:(from:now-1y,mode:quick,to:now))"
            },
            {
                "title": "Business Process Activities",
                "url": "#/dashboard/548c5e20-cd6f-11e9-b5e8-e908493e1aa7?embed=true&_g=(refreshInterval%3A(pause%3A!t%2Cvalue%3A0)%2Ctime%3A(from%3Anow%2FM%2Cmode%3Aquick%2Cto%3Anow%2FM))"
            },
            {
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
    "logoPath": "./assets/logo_mvp.png",
    "federationLogoPath": "./assets/logo_mvp_efactory.png",
    "logoRequired": false,
    "permanentWelcomeTab": false,
    "phoneNumberRequired": false,
    "productServiceFiltersEnabled":true,
    "vatEnabled": true,
    "projectsEnabled": true,
    "requiredAgreements": [
        {
            "title": "End-User License Agreement (EULA)",
            "src": "./assets/eula.pdf"
        }
    ],
    "showChat": true,
    "showAgent": true,
    "showCompanyMembers": false,
    "showCompanyDetailsInPlatformMembers":false,
    "showExplorative": true,
    "showFullName": false,
    "showLCPA": true,
    "showPPAP": true,
    "showTrack": true,
    "showTrade": true,
    "showVerification": true,
    "standardCurrency": "EUR",
    "standardTaxonomy": "All",
    "supportedActivitySectors": {
        "": {},
        "Logistics Provider": {},
        "Manufacturer": {},
        "Service Provider": {},
        "Other": {}
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
    "supportMail": "nimble-support@salzburgresearch.at",
    "supportMailContent": {
        "en": "Dear NIMBLE support team,\n\n\nI have encountered an issue.\n\nDescription of the issue:\n[Please insert a detailed description of the issue here. Add some screenshots as an attachement if they are of use.]",
        "es": "Equipo de soporte NIMBLE,\n\n\nHe detectado una incidencia.\n\nDescripción:\n[Por favor indique a continuación los detalles de la incidencia. Si es posible incluya alguna captura de pantalla si puede ser de utilidad.]"
    },
    "showLoginFederation": true,
    "unshippedOrdersTabEnabled": true,
    "welcomeMessage":"Looks like you are new here",
    "federationClientID": "efact-test-client",
    "federationIDP": "EFS",
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

// Definition of relevant index fields used for product and party display
// >>>
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
export const item_manufacturer_id = "manufacturerId";
// <<<
// Grouping of facets into categories (Product / Service, Vendor, Trust / Rating, Other)
// >>>
export const product_filter_prod = ["freeOfCharge", "certificateType", "applicableCountries", "customizable"];
export const product_filter_comp = ["manufacturer.legalName", "manufacturer.brandName", "manufacturer.businessType", "manufacturer.activitySectors", "manufacturer.businessKeywords", "manufacturer.origin", "manufacturer.certificateType", "manufacturer.ppapComplianceLevel", "manufacturer.ppapDocumentType"];
export const party_facet_field_list = ["legalName", "{LANG}_brandName", "businessType", "{LANG}_activitySectors", "{LANG}_businessKeywords", "{NULL}_origin", "{NULL}_certificateType", "ppapComplianceLevel", "ppapDocumentType"];
export const party_filter_main = ["businessType", "activitySectors", "businessKeywords", "origin", "certificateType", "ppapComplianceLevel", "ppapDocumentType"];
export const party_filter_trust = ["trustScore", "trustRating", "trustSellerCommunication", "trustFullfillmentOfTerms", "trustDeliveryPackaging", "trustNumberOfTransactions"];
export const product_filter_trust = ["manufacturer.trustScore", "manufacturer.trustRating", "manufacturer.trustSellerCommunication", "manufacturer.trustFullfillmentOfTerms", "manufacturer.trustDeliveryPackaging", "manufacturer.trustNumberOfTransactions"];
// <<<
// Used to overwrite facet name mappings from the backend services
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
// Facets removed from the UI by full name
export const product_nonfilter_full = ["_text_", "_version_", "id", "image", "localName", "languages", "catalogueId", "doctype", "manufacturerId", "manufacturerItemId", "allLabels"];
// Facets removed from the UI by regex
export const product_nonfilter_regex = ["lmf.", "manufacturer.", "_id", "_txt", "_desc", "_label", "_key", "_price", "_currency", "httpwwwnimbleprojectorgresourceeclasshttpwwwnimbleprojectorgresourceeclasshttpwwwnimbleprojectorgresourceeclasshttpwwwnimbleprojectorgresourceeclass"];
// Facets removed from the UI by data type
export const product_nonfilter_data_type = []
// Facets used for configuration
export const product_configurable = [];
// Facets used for default fields
export const product_default = {};
// Defines the minimum count of a facet field to appear in the search results
export const facet_min = 1;
// Defined the maximum number of fields to be returned for a facet (-1 = unlimited)
export const facet_count = -1;
// Query settings for product search
/*
- fields: Array of fields to include in query building. Applicable values are any field name (with {LANG}_ as a placeholder for multilingual fields) and "STANDARD" (for any other field)
- boosting: Boolean flag if boosting shall be applied to the search query according to the "boostingFactors" settings
- boostingFactors: Allows defining different boosting factors for searching by relevance. Keys are the field names listed in "fields" and values are -1 (for negative boosts) or a multiple of 2
*/
export const query_settings = {
    "fields": ["STANDARD","classification.allLabels","{LANG}_label", "{LANG}_desc"],
    "boosting": true,
    "boostingFactors": {
        "STANDARD": 4,
        "classification.allLabels":16,
        "{LANG}_label": 64,
        "{LANG}_desc": -1
    }
};
// Query settings for company search
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
