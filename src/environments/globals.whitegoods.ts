'use strict';

// Development variables

export const debug = false;

// Base path variables - WhiteGoods development via service discovery

export const base_path = "http://nimblewg.holonix.biz";
export const ub_base = "http://nimblewg.holonix.biz/search";
export const pw_reset_link = "http://nimblewg.holonix.biz:8080/auth/realms/master/login-actions/reset-credentials?client_id=nimble_client";


// Service endpoints

export const user_mgmt_endpoint=`${base_path}/identity`;
export const catalogue_endpoint=`${base_path}/catalog`;
export const bpe_endpoint=`${base_path}/business-process`;
export const data_channel_endpoint=`${base_path}/data-channel`;
export const data_aggregation_endpoint=`${base_path}/data-aggregation`;
export const trust_service_endpoint=`${base_path}/trust`;
export const indexing_service_endpoint=`${base_path}/indexing-service`;


// BIBA endpoints

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


// TnT Endpoints

export const tntEndpoint = `${bpe_endpoint}/t-t/epc-details`;
export const tntAnalysisEndpoint = `${base_path}/tnt/simpleTrackingAnalysis`;


// Platform Configuration

export const config = {
  "companyRegistrationRequired": false,
  "categoryFilter": {
    "eClass": {
      "hiddenCategories": [],
      "logisticsCategory": "14000000",
      "ontologyPrefix": "http://www.nimble-project.org/resource/eclass#"
    },
    "FurnitureOntology": {
      "hiddenCategories": ["Catalogue","Company","ContactPerson","Guarantee","Price","Process","Standard","Style","Technique"],
      "logisticsCategory": "LogisticsService",
      "ontologyPrefix": "http://nimblewg.holonix.biz/FurnitureSectorOntology.owl#"
    }
  },
  "dataChannelsEnabled" : true,
  "imprint": "<u>Platform Owner & Provider</u><br/><b>Holonix Srl.</b><br/>",
  "logoPath": "./assets/logo_wg.png",
  "logoRequired": false,
  "phoneNumberRequired": false,
  "requiredAgreements": [
    {
      "title":"End-User License Agreement (EULA)",
      "src":"./assets/eula.pdf"
    }
  ],
  "showCompanyMembers": false,
  "showExplorative": true,
  "showPPAP": true,
  "showTrack": true,
  "showTrade": true,
  "showVerification": true,
  "standardTaxonomy": "All",
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
  "supportMail": "musumeci.holonix+nimblesupport@gmail.com",
  "supportMailContent": {
    "en":"Dear NIMBLE support team,\n\n\nI have encountered an issue.\n\nDescription of the issue:\n[Please insert a detailed description of the issue here. Add some screenshots as an attachement if they are of use.]",
    "es":"Equipo de soporte NIMBLE,\n\n\nHe detectado una incidencia.\n\nDescripción:\n[Por favor indique a continuación los detalles de la incidencia. Si es posible incluya alguna captura de pantalla si puede ser de utilidad.]"
  }
};


// Catalogue format variables

export const product_vendor = "manufacturer";
export const product_vendor_id = "id";
export const product_vendor_name = "legalName";
export const product_vendor_rating = "trustRating";
export const product_vendor_rating_seller = "trustSellerCommunication";
export const product_vendor_rating_fulfillment = "trustFullfillmentOfTerms";
export const product_vendor_rating_delivery = "trustDeliveryPackaging";
export const product_vendor_trust = "trustScore";
export const product_name = "label";
export const product_description = "description";
export const product_img = "imgageUri";
export const product_price = "price";
export const product_currency = "currency";
export const product_cat = "classificationUri";
export const product_cat_mix = "commodityClassficationUri";
export const product_filter_prod = ["freeOfCharge","certificateType","applicableCountries"];
export const product_filter_comp = ["manufacturer.legalName","manufacturer.origin","manufacturer.certificateType","manufacturer.ppapComplianceLevel","manufacturer.ppapDocumentType"];
export const party_facet_field_list = ["legalName","origin","certificateType","ppapComplianceLevel","ppapDocumentType"];
export const item_manufacturer_id = "manufacturerId";
export const product_filter_trust = ["manufacturer.trustScore","manufacturer.trustRating","manufacturer.trustSellerCommunication","manufacturer.trustFullfillmentOfTerms","manufacturer.trustDeliveryPackaging","manufacturer.trustNumberOfTransactions"];
export const product_filter_mappings = {
  "price": "Price",
  "currency": "Currency"
};
export const product_nonfilter_full = ["_text_","_version_","id","image","localName","languages","catalogueId","doctype","manufacturerId","manufacturerItemId"];
export const product_nonfilter_regex = ["lmf.","_id", "_txt", "_desc", "_label", "_key", "_price", "_currency", "httpwwwnimbleprojectorgresourceeclasshttpwwwnimbleprojectorgresourceeclasshttpwwwnimbleprojectorgresourceeclasshttpwwwnimbleprojectorgresourceeclass"];
export const product_configurable = [];
export const product_default = {};
export const facet_min = 1;
export const facet_count = -1;
export const query_settings = {
  "fields": ["STANDARD","commodityClassficationUri","{LANG}_label","{LANG}_desc"],
  "boosting": true,
  "boostingFactors": {
    "STANDARD": 4,
    "commodityClassficationUri": 16,
    "{LANG}_label": 64,
    "{LANG}_desc": -1
  }
};
