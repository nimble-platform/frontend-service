'use strict';

// Development variables

export const debug = false;


// Base path variables

export const base_path = "http://b2bmarket.aidimme.es";
export const ub_base = "http://b2bmarket.aidimme.es/ub-search";
export const idpURL = "http://b2bmarket.aidimme.es:8080/auth/realms/master";
export const collab_path = "http://nimble.eu-de.containers.appdomain.cloud/collaborations";
export const pw_reset_link = idpURL + "/login-actions/reset-credentials?client_id=nimble_client";
export const frontendURL = base_path;


// Service endpoints

export const user_mgmt_endpoint = `${base_path}/api/identity`;
export const catalogue_endpoint = `${base_path}/api/catalog`;
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


// Platform Configuration

export const config = {
    "federationInstanceId": "FMP",
    "platformName": "B2BMarket",
    "platformNameInMail":"B2BMarket",
    "envName": "fmp",
    "addCartBehaviour": "single",
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
    "displayCategoryCounts":false,
    "docLink": "http://b2bm.aidimme.es/manual-de-usuario/",
    "faviconPath": "./assets/B2B_favicon.ico",
    "frameContractTabEnabled": true,
    "hidePriceFunctionality": false,
    "imprint": {
        "en": "<table class='table table-borderless'><tr><td class='w-50 p-0 pr-3'><u>Platform Owner</u><br/><b>AIDIMME - Technological Institute of Metalworking, Furniture, Wood, Packaging and Related sectors</b><br/>Technological Park, Benjamín Franklin Street 13<br/>46980 Paterna (Valencia), Spain<br/>Phone: +34.961.366.070<br/>E-Mail: <a href='mailto:info@aidimme.es'>info@aidimme.es</a><br/>CIF: G46261590<br/><br/><b>FEVAMA-Wood and Furniture Business Federation of Valencian Community</b><br/>Technological Park, Benjamín Franklin Street 13<br/>46980 Paterna (Valencia), Spain<br/>Phone: +34 96 121 16 00<br/>Fax: +34 96 121 19 31<br/>E-Mail: <a href='mailto:fevama@fevama.es'>fevama@fevama.es</a><br/>E-Mail: <a href='http://fevama.es'>http://fevama.es</a></td><td class='w-50 p-0 pl-3'><u>Platform Provider</u><br/><b>AIDIMME</b><br/>Technological Park, Benjamin Franklin, 13<br/>46980 Paterna, Valencia, Spain<br/>Phone: +34 961366070<br/>Fax: +34961366185<br/>E-Mail: <a href='mailto:info@aidimme.es'>info@aidimme.es</a><br/>Internet: <a href='http://www.aidimme.es' target='_blank'>http://www.aidimme.es</a><br/>CIF: ESG 46261590</td></tr></table>",
        "es": "<table class='table table-borderless'><tr><td class='w-50 p-0 pr-3'><u>Dueño de la Plataforma</u><br/><b>AIDIMME - Instituto Tecnológico de la Metalmecánica, Muebles, Madera, Empaques y sectores relacionados</b><br/>Parque Tecnológico, Calle Benjamín Franklin 13<br/>46980 Paterna (Valencia), España<br/>Teléfono: +34.961.366.070<br/>Correo electrónico: <a href='mailto:info@aidimme.es'>info@aidimme.es</a><br/>CIF: G46261590<br/><br/><b>FEVAMA-Federación Empresarial de la Madera y Mueble de la Comunidad Valenciana</b><br/>Parque Tecnológico, Calle Benjamín Franklin 13<br/>46980 Paterna (Valencia), España<br/>Teléfono: +34 96 121 16 00<br/>Fax: +34 96 121 19 31<br/>E-Mail: <a href='mailto:fevama@fevama.es'>fevama@fevama.es</a><br/>E-Mail: <a href='http://fevama.es'>http://fevama.es</a></td><td class='w-50 p-0 pl-3'><u>Proveedor de plataforma</u><br/><b>AIDIMME</b><br/>Parque Tecnológico, Calle Benjamín Franklin, 13 <br/>46980 Paterna, Valencia, España<br/>Teléfono: +34 961366070<br/>Fax: +34961366185<br/>E-Mail: <a href='mailto:info@aidimme.es'>info@aidimme.es</a><br/>Internet: <a href='http://www.aidimme.es' target='_blank'>http://www.aidimme.es</a><br/>CIF: ESG 46261590</td></tr></table>"
    },
    "kibanaConfig": {
        "companyDashboards": [
            {
                "title": "Company Visits",
                "url": "#/dashboard/6e450310-5ecb-11ea-a859-83b39107c38e?embed=true&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-90d,to:now))&_a=(description:'',filters:!(('$state':(store:appState),meta:(alias:!n,disabled:!f,index:'16950440-5e2f-11ea-a63d-ebb31fe7e4db',key:companyId,negate:!f,params:(query:'41915'),type:phrase),query:(match_phrase:(companyId:'41915')))),fullScreenMode:!f,options:(hidePanelTitles:!f,useMargins:!t),panels:!((embeddableConfig:(),gridData:(h:15,i:'4a15df25-80e4-48ef-9c0b-1601fb4c1815',w:24,x:0,y:0),id:'3f922e40-5e2f-11ea-a63d-ebb31fe7e4db',panelIndex:'4a15df25-80e4-48ef-9c0b-1601fb4c1815',type:visualization,version:'7.6.0'),(embeddableConfig:(),gridData:(h:15,i:'239583b6-eab9-455d-9233-e4549bf5b0a0',w:24,x:24,y:0),id:'6c695120-5ebe-11ea-a859-83b39107c38e',panelIndex:'239583b6-eab9-455d-9233-e4549bf5b0a0',type:visualization,version:'7.6.0')),query:(language:kuery,query:'activity:%20%22company_visit%22'),timeRestore:!f,title:'Company%20Visits',viewMode:view)"
            },
            {
                "title": "Product / Service Visits",
                "url": "#/dashboard/eeca54a0-5ecf-11ea-963f-17e4bedb41f4?embed=true&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-90d,to:now))&_a=(description:'',filters:!(('$state':(store:appState),meta:(alias:!n,disabled:!f,index:'16950440-5e2f-11ea-a63d-ebb31fe7e4db',key:manufactured_companyId.keyword,negate:!f,params:(query:'41915'),type:phrase),query:(match_phrase:(manufactured_companyId.keyword:'41915')))),fullScreenMode:!f,options:(hidePanelTitles:!f,useMargins:!t),panels:!((embeddableConfig:(),gridData:(h:15,i:'752bcd1f-5745-4286-b69c-954251638e42',w:24,x:0,y:0),id:bcc60870-5ec3-11ea-a859-83b39107c38e,panelIndex:'752bcd1f-5745-4286-b69c-954251638e42',type:visualization,version:'7.6.0'),(embeddableConfig:(),gridData:(h:15,i:'21102c94-618f-47c6-ab7b-810a9ecb31b8',w:24,x:24,y:0),id:'75753d00-5ec4-11ea-a859-83b39107c38e',panelIndex:'21102c94-618f-47c6-ab7b-810a9ecb31b8',type:visualization,version:'7.6.0')),query:(language:kuery,query:''),timeRestore:!f,title:'%20Product%20Visits',viewMode:view)"
            }
        ],
        "companyGraphs": [
            {
                "title": "Product / Service Category",
                "url": "#/dashboard/d5031910-5f94-11ea-94fc-37c6dea1ac9f?embed=true&_g=(refreshInterval:(pause:!t,value:0),time:(from:now-15m,to:now))&_a=(description:'',filters:!(('$state':(store:appState),meta:(alias:!n,disabled:!f,index:'16950440-5e2f-11ea-a63d-ebb31fe7e4db',key:manufactured_companyId,negate:!f,params:(query:'41915'),type:phrase),query:(match_phrase:(manufactured_companyId:'41915')))),fullScreenMode:!f,options:(hidePanelTitles:!f,useMargins:!t),panels:!((embeddableConfig:(),gridData:(h:15,i:'7fea8508-aaf9-4145-9c14-a6cdbe8889d5',w:17,x:0,y:0),id:'1e408fd0-5ec4-11ea-a859-83b39107c38e',panelIndex:'7fea8508-aaf9-4145-9c14-a6cdbe8889d5',type:visualization,version:'7.6.0')),query:(language:kuery,query:''),timeRestore:!f,title:'Product%2FService%20By%20Category',viewMode:view)"
            },
            {
                "title": "Product / Service Category Filter",
                "url": "#/dashboard/3f49fa00-5f95-11ea-94fc-37c6dea1ac9f?embed=true&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-30d,to:now))&_a=(description:'',filters:!(('$state':(store:appState),meta:(alias:!n,disabled:!f,index:'16950440-5e2f-11ea-a63d-ebb31fe7e4db',key:manufactured_companyId,negate:!f,params:(query:'41915'),type:phrase),query:(match_phrase:(manufactured_companyId:'41915')))),fullScreenMode:!f,options:(hidePanelTitles:!f,useMargins:!t),panels:!((embeddableConfig:(),gridData:(h:14,i:cfcdda34-160d-4f04-bfc0-cbde6b0e0f8a,w:16,x:0,y:0),id:f2de6930-5ec2-11ea-a859-83b39107c38e,panelIndex:cfcdda34-160d-4f04-bfc0-cbde6b0e0f8a,type:visualization,version:'7.6.0')),query:(language:kuery,query:''),timeRestore:!f,title:'Product%20%2F%20Service%20Category%20Filter',viewMode:view)"
            }
        ],
        "dashboards": [
            {
                "title": "User Logins & Registrations",
                "url": "#/dashboard/0c6b7980-5ed0-11ea-963f-17e4bedb41f4?embed=true&_g=(refreshInterval:(pause:!t,value:0),time:(from:now-90d,to:now))&_a=(description:'',filters:!(),fullScreenMode:!f,options:(hidePanelTitles:!f,useMargins:!t),panels:!((embeddableConfig:(legendOpen:!f,vis:(legendOpen:!t)),gridData:(h:17,i:a2640542-3a79-4b33-9ea0-b086c8592bbe,w:23,x:0,y:0),id:'5401f3c0-5ebf-11ea-a859-83b39107c38e',panelIndex:a2640542-3a79-4b33-9ea0-b086c8592bbe,type:visualization,version:'7.6.0'),(embeddableConfig:(),gridData:(h:17,i:'8bf4cf4f-da76-465b-886d-a80426aa6d7f',w:12,x:23,y:0),id:f89af210-5ebf-11ea-a859-83b39107c38e,panelIndex:'8bf4cf4f-da76-465b-886d-a80426aa6d7f',type:visualization,version:'7.6.0'),(embeddableConfig:(),gridData:(h:17,i:'92fb3afb-ec60-40e0-a564-356ac807ebcb',w:13,x:35,y:0),id:'45dc03c0-5ec0-11ea-a859-83b39107c38e',panelIndex:'92fb3afb-ec60-40e0-a564-356ac807ebcb',type:visualization,version:'7.6.0')),query:(language:kuery,query:''),timeRestore:!f,title:'User%20Activities',viewMode:view)"
            }, {
                "title": "Business Process Activities",
                "url": "#/dashboard/d3d93160-5ecb-11ea-a859-83b39107c38e?embed=true&_g=(refreshInterval:(pause:!t,value:0),time:(from:now-90d,to:now))&_a=(description:'',filters:!(),fullScreenMode:!f,options:(hidePanelTitles:!f,useMargins:!t),panels:!((embeddableConfig:(),gridData:(h:15,i:'3b244ee0-0e21-49b6-b6d7-a4bc60005e13',w:18,x:0,y:0),id:b0a09d00-5ebc-11ea-a859-83b39107c38e,panelIndex:'3b244ee0-0e21-49b6-b6d7-a4bc60005e13',type:visualization,version:'7.6.0'),(embeddableConfig:(),gridData:(h:15,i:e6b6b66a-866b-4a11-a6f7-3019e282c0d6,w:14,x:18,y:0),id:'829b1bc0-5ebb-11ea-a859-83b39107c38e',panelIndex:e6b6b66a-866b-4a11-a6f7-3019e282c0d6,type:visualization,version:'7.6.0'),(embeddableConfig:(),gridData:(h:15,i:'9d15824e-a1f1-488c-b53c-e113705db189',w:16,x:32,y:0),id:'9af76020-5ebb-11ea-a859-83b39107c38e',panelIndex:'9d15824e-a1f1-488c-b53c-e113705db189',type:visualization,version:'7.6.0')),query:(language:kuery,query:''),timeRestore:!f,title:'Business%20Processes',viewMode:view)"
            }, {
                "title": "Products Activities",
                "url": "#/dashboard/b79de140-5ecf-11ea-963f-17e4bedb41f4?embed=true&_g=(refreshInterval:(pause:!t,value:0),time:(from:now-30d,to:now))&_a=(description:'',filters:!(),fullScreenMode:!f,options:(hidePanelTitles:!f,useMargins:!t),panels:!((embeddableConfig:(),gridData:(h:12,i:'05a6e2a6-e660-4d95-908c-838dbe3b9412',w:15,x:0,y:0),id:'86a32490-5ebd-11ea-a859-83b39107c38e',panelIndex:'05a6e2a6-e660-4d95-908c-838dbe3b9412',type:visualization,version:'7.6.0'),(embeddableConfig:(),gridData:(h:12,i:'014428fd-361e-47f4-8dc8-3ec127f13cab',w:16,x:15,y:0),id:'99dccec0-5ec3-11ea-a859-83b39107c38e',panelIndex:'014428fd-361e-47f4-8dc8-3ec127f13cab',type:visualization,version:'7.6.0'),(embeddableConfig:(),gridData:(h:12,i:f1416bbb-a6a9-4fad-a9ab-f52bca8b4260,w:17,x:31,y:0),id:'6b3bf7e0-5ec2-11ea-a859-83b39107c38e',panelIndex:f1416bbb-a6a9-4fad-a9ab-f52bca8b4260,type:visualization,version:'7.6.0')),query:(language:kuery,query:''),timeRestore:!f,title:'Product%20Activities',viewMode:view)"
            },
            {
                "title": "Product / Service Visits",
                "url": "#/dashboard/741b31a0-5ecc-11ea-a859-83b39107c38e?embed=true&_g=(refreshInterval:(pause:!t,value:0),time:(from:now-30d,to:now))&_a=(description:'',filters:!(),fullScreenMode:!f,options:(hidePanelTitles:!f,useMargins:!t),panels:!((embeddableConfig:(),gridData:(h:16,i:'4ef00550-d7aa-4198-8f7c-a81ebcbad82e',w:13,x:0,y:0),id:'75753d00-5ec4-11ea-a859-83b39107c38e',panelIndex:'4ef00550-d7aa-4198-8f7c-a81ebcbad82e',type:visualization,version:'7.6.0'),(embeddableConfig:(),gridData:(h:16,i:f458d9ea-f8cc-4269-819a-3f4d8014df30,w:12,x:13,y:0),id:ae19b1c0-5ec1-11ea-a859-83b39107c38e,panelIndex:f458d9ea-f8cc-4269-819a-3f4d8014df30,type:visualization,version:'7.6.0'),(embeddableConfig:(),gridData:(h:16,i:'8b19dbbe-5124-4ca8-ac83-dbc343385f17',w:12,x:25,y:0),id:bcc60870-5ec3-11ea-a859-83b39107c38e,panelIndex:'8b19dbbe-5124-4ca8-ac83-dbc343385f17',type:visualization,version:'7.6.0'),(embeddableConfig:(),gridData:(h:16,i:'8c5f3736-5a42-4553-b218-80f250890c1a',w:11,x:37,y:0),id:afd84720-5ec0-11ea-a859-83b39107c38e,panelIndex:'8c5f3736-5a42-4553-b218-80f250890c1a',type:visualization,version:'7.6.0')),query:(language:kuery,query:''),timeRestore:!f,title:'Platform%20Visits%20Dashboard',viewMode:view)"
            },
            {
                "title": "Company Visits",
                "url": "#/dashboard/064584a0-5ecc-11ea-a859-83b39107c38e?embed=true&_g=(refreshInterval:(pause:!t,value:0),time:(from:now-30d,to:now))&_a=(description:'',filters:!(),fullScreenMode:!f,options:(hidePanelTitles:!f,useMargins:!t),panels:!((embeddableConfig:(),gridData:(h:15,i:d5d3d546-8e79-4bba-afa0-60894de883a2,w:24,x:0,y:0),id:'6c695120-5ebe-11ea-a859-83b39107c38e',panelIndex:d5d3d546-8e79-4bba-afa0-60894de883a2,type:visualization,version:'7.6.0'),(embeddableConfig:(),gridData:(h:15,i:'8fe78cb9-602b-4024-8beb-cd083365cc7b',w:24,x:24,y:0),id:'3f922e40-5e2f-11ea-a63d-ebb31fe7e4db',panelIndex:'8fe78cb9-602b-4024-8beb-cd083365cc7b',type:visualization,version:'7.6.0')),query:(language:kuery,query:''),timeRestore:!f,title:'Platform%20Company%20Visits',viewMode:view)"
            }
        ]
    },
    "kibanaEnabled": true,
    "languageSettings": {
        "available": ["en", "es"],
        "fallback": "en"
    },
    "loggingEnabled": true,
    "logoPath": "./assets/B2BM.png",
    "federationLogoPath": "./assets/logo_mvp_efactory.png",
    "logoRequired": true,
    "networkEnabled": false,
    "permanentWelcomeTab": true,
    "phoneNumberRequired": true,
    "productServiceFiltersEnabled":false,
    "productOfferingEnabled":false,
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
    "showBusinessKeywordsInCompanyDetails":false,
    "showCompanyMembers": true,
    "showCompanyDetailsInPlatformMembers":true,
    "showExplorative": false,
    "showFullName": true,
    "showGoogleTranslateOption": false,
    "showLCPA": false,
    "showPPAP": false,
    "showTrack": false,
    "showTrade": false,
    "showVerification": false,
    "standardCurrency": "EUR",
    "standardTaxonomy": "FurnitureOntology",
    "supportedActivitySectors": {
        "": {},
        "Logistics Provider": {
            "General": {
                "en": "General",
                "es": "General"
            }
        },
        "Manufacturer": {
            "Bathroom": {
                "en": "Bathroom",
                "es": "Baño"
            },
            "Carpentry": {
                "en": "Carpentry",
                "es": "Carpintería"
            },
            "Childcare": {
                "en": "Childcare",
                "es": "Cuidado de niños"
            },
            "Closet / Cupboard": {
                "en": "Closet / Cupboard",
                "es": "Armario / Armario"
            },
            "Contract": {
                "en": "Contract",
                "es": "Contrato"
            },
            "Doors / Windows": {
                "en": "Doors / Windows",
                "es": "Puertas / Ventanas"
            },
            "Furniture for Retail": {
                "en": "Furniture for Retail",
                "es": "Muebles para venta minorista"
            },
            "Home": {
                "en": "Home",
                "es": "Casa"
            },
            "Hotels, Restaurants & Cafes": {
                "en": "Hotels, Restaurants & Cafes",
                "es": "Hoteles, restaurantes y cafeterías"
            },
            "Kids": {
                "en": "Kids",
                "es": "Niños"
            },
            "Kitchen": {
                "en": "Kitchen",
                "es": "Cocina"
            },
            "Lightings / Lamps": {
                "en": "Lightings / Lamps",
                "es": "Iluminaciones / Lámparas"
            },
            "Mattresses": {
                "en": "Mattresses",
                "es": "Colchones"
            },
            "Office": {
                "en": "Office",
                "es": "Oficina"
            },
            "Outdoor Furniture": {
                "en": "Outdoor Furniture",
                "es": "Mueble para exteriores"
            },
            "Panels": {
                "en": "Panels",
                "es": "Paneles"
            },
            "Parquet Floors": {
                "en": "Parquet Floors",
                "es": "Suelos de parquet"
            },
            "Upholstered Furniture": {
                "en": "Upholstered Furniture",
                "es": "Muebles tapizados"
            },
            "Wooden Packaging": {
                "en": "Wooden Packaging",
                "es": "Embalaje de madera"
            }
        },
        "Retailer": {
            "General": {
                "en": "General",
                "es": "General"
            }
        },
        "Service Provider": {
            "Architects": {
                "en": "Architects",
                "es": "Arquitectos"
            },
            "Buyer-Designer": {
                "en": "Buyer-Designer",
                "es": "Comprador-diseñador"
            },
            "Certification": {
                "en": "Certification",
                "es": "Certificación"
            },
            "Consulting": {
                "en": "Consulting",
                "es": "Consultante"
            },
            "Design / Decoration": {
                "en": "Design / Decoration",
                "es": "Diseño / Decoración"
            },
            "Distributor": {
                "en": "Distributor",
                "es": "Distribuidor"
            },
            "Engineering": {
                "en": "Engineering",
                "es": "Ingenieria"
            },
            "Facility Cleaning": {
                "en": "Facility Cleaning",
                "es": "Limpieza de instalaciones"
            },
            "Facility Maintenance": {
                "en": "Facility Maintenance",
                "es": "Mantenimiento de instalaciones"
            },
            "Furniture Installer": {
                "en": "Furniture Installer",
                "es": "Instalador de muebles"
            },
            "Legal Services": {
                "en": "Legal Services",
                "es": "Servicios jurídicos"
            },
            "Outsourcing": {
                "en": "Outsourcing",
                "es": "Subcontratación"
            },
            "Print Services": {
                "en": "Print Services",
                "es": "Servicios de impresión"
            },
            "Quality Control / Tests": {
                "en": "Quality Control / Tests",
                "es": "Control de calidad / Pruebas"
            },
            "Sales Agent": {
                "en": "Sales Agent",
                "es": "Agente de ventas"
            },
            "Training": {
                "en": "Training",
                "es": "Formación"
            },
            "Waste Management": {
                "en": "Waste Management",
                "es": "Gestión de residuos"
            }
        },
        "Supplier": {
            "Adhesives": {
                "en": "Adhesives",
                "es": "Adhesivos"
            },
            "Board": {
                "en": "Board",
                "es": "Tablero"
            },
            "Ceramic": {
                "en": "Ceramic",
                "es": "Cerámico"
            },
            "Composites": {
                "en": "Composites",
                "es": "Composicion"
            },
            "Cork": {
                "en": "Cork",
                "es": "Corcho"
            },
            "Decorated Paper": {
                "en": "Decorated Paper",
                "es": "Papel decorado"
            },
            "Fitting": {
                "en": "Fitting",
                "es": "Adecuado"
            },
            "Foam": {
                "en": "Foam",
                "es": "Espuma"
            },
            "Glass": {
                "en": "Glass",
                "es": "Vaso"
            },
            "Machinery": {
                "en": "Machinery",
                "es": "Maquinaria"
            },
            "Metal": {
                "en": "Metal",
                "es": "Metal"
            },
            "Packaging Materials": {
                "en": "Packaging Materials",
                "es": "Materiales de embalaje"
            },
            "Paints & Varnishes": {
                "en": "Paints & Varnishes",
                "es": "Pinturas y Barnices"
            },
            "Plastic": {
                "en": "Plastic",
                "es": "Plástico"
            },
            "Plywood": {
                "en": "Plywood",
                "es": "Madera contrachapada"
            },
            "Straw": {
                "en": "Straw",
                "es": "Paja"
            },
            "Textile": {
                "en": "Textile",
                "es": "Textil"
            },
            "Tools": {
                "en": "Tools",
                "es": "Herramientas"
            },
            "Veneer": {
                "en": "Veneer",
                "es": "Chapa"
            },
            "Wood": {
                "en": "Wood",
                "es": "Madera"
            }
        }
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
    "supportMail": "b2bmarket@aidimme.es",
    "supportMailContent": {
        "en": "Dear B2BMarket support team,\n\n\nI have encountered an issue.\n\nDescription of the issue:\n[Please insert a detailed description of the issue here. Add some screenshots as an attachement if they are of use.]",
        "es": "Equipo de soporte B2BMarket,\n\n\nHe detectado una incidencia.\n\nDescripción:\n[Por favor indique a continuación los detalles de la incidencia. Si es posible incluya alguna captura de pantalla si puede ser de utilidad.]"
    },
    "showLoginFederation": false,
    "unshippedOrdersTabEnabled": false,
    "welcomeMessage":{
        "en": "Welcome to B2BMarket platform.",
        "es": "Bienvenidos a la plataforma B2BMarket",
        "de": "Sieht aus, als seien Sie neu hier",
    },
    "whiteBlackListForCatalogue":false,
    "federationClientID": "sample-client",
    "federationIDP": "sampleIDP",
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
export const product_currency = "currency";
export const product_cat = "classificationUri";
export const product_cat_mix = "commodityClassficationUri";
export const product_filter_prod = ["freeOfCharge", "certificateType", "applicableCountries", "customizable"];
export const product_filter_comp = [ "manufacturer.brandName", "manufacturer.activitySectors", "manufacturer.origin"];
export const party_facet_field_list = ["legalName", "{LANG}_brandName", "businessType", "{LANG}_activitySectors", "{LANG}_businessKeywords", "{NULL}_origin", "{NULL}_certificateType"];
export const party_filter_main = ["activitySectors", "origin", "certificateType"];
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
export const product_nonfilter_full = ["_text_", "_version_", "id", "image", "localName", "languages", "catalogueId", "doctype", "manufacturerId", "manufacturerItemId", "manufacturer.ppapComplianceLevel", "manufacturer.ppapDocumentType", "allLabels"];
export const product_nonfilter_regex = ["lmf.", "manufacturer.", "_id", "_txt", "_desc", "_label", "_key", "_price", "_currency", "httpwwwnimbleprojectorgresourceeclasshttpwwwnimbleprojectorgresourceeclasshttpwwwnimbleprojectorgresourceeclasshttpwwwnimbleprojectorgresourceeclass","baseQuantity","items_package","_deliveryTime"];
export const product_nonfilter_data_type = ["string","double","price"]
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
