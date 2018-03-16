'use strict';

// Development variables

export const debug=false;


// Endpoint variables - SRFG staging

//export const user_mgmt_endpoint="http://nimble-staging.salzburgresearch.at/identity";
//export const catalogue_endpoint="http://nimble-staging.salzburgresearch.at/catalog";
//export const bpe_endpoint="http://nimble-staging.salzburgresearch.at/business-process";


// Endpoint variables - SRFG productive

export const user_mgmt_endpoint="https://nimble-platform.salzburgresearch.at/nimble/identity";
export const catalogue_endpoint="https://nimble-platform.salzburgresearch.at/nimble/catalog";
export const bpe_endpoint="https://nimble-platform.salzburgresearch.at/nimble/business-process";


// Endpoint variables - K8S domain

//export const user_mgmt_endpoint="http://nimble.uk-south.containers.mybluemix.net/identity";
//export const catalogue_endpoint="http://nimble.uk-south.containers.mybluemix.net/catalog";
//export const bpe_endpoint="http://nimble.uk-south.containers.mybluemix.net/business-process";


// Endpoint variables - Local development via service discovery

//export const user_mgmt_endpoint="http://localhost:443/identity";
//export const catalogue_endpoint="http://localhost:443/catalog";
//export const bpe_endpoint="http://localhost:443/business-process";


// Marmotta endpoint variables

export const simple_search_endpoint="https://nimble-platform.salzburgresearch.at/marmotta/solr/catalogue2/select";


// Endpoint variables - BIBA domain

// export const languageEndPoint = `${ub_base_8090}/getSupportedLanguages`;
export const languageEndPoint = "https://nimble-platform.salzburgresearch.at/nimble/search/getSupportedLanguages";
export const endpoint = "https://nimble-platform.salzburgresearch.at/nimble/search/detectMeaningLanguageSpecific";
export const logicalViewEndpoint = "https://nimble-platform.salzburgresearch.at/nimble/search/getLogicalView";
export const propertyEndPoint = "https://nimble-platform.salzburgresearch.at/nimble/search/getPropertyValuesDiscretised";
export const sparqlEndPoint = "https://nimble-platform.salzburgresearch.at/nimble/search/executeSPARQLSelect";
export const sparqlOptionalSelectEndPoint = "https://nimble-platform.salzburgresearch.at/nimble/search/executeSPARQLOptionalSelect";
export const spqButton = "https://nimble-platform.salzburgresearch.at/nimble/search/getSQPFromOrangeGroup";
export const obs_propFromConcept = "https://nimble-platform.salzburgresearch.at/nimble/search/getPropertyFromConcept";
export const obs_propValueFromConcept = "https://nimble-platform.salzburgresearch.at/nimble/search/getPropertyValuesFromGreenGroup";
export const referenceFromConcept = "https://nimble-platform.salzburgresearch.at/nimble/search/getReferencesFromAConcept";
export const sqpOrangeConcept = "https://nimble-platform.salzburgresearch.at/nimble/search/getPropertyValuesFromOrangeGroup";


// Catalogue format variables

export const product_name = "item_name";
export const product_vendor_id = "item_manufacturer_id";
export const product_vendor_name = "item_manufacturer_name";
export const product_img = "item_image";
export const product_nonfilter_full = ["id","_version_","item_description","item_price","item_price_currency"];
export const product_nonfilter_regex = ["lmf.","_id"];
export const product_configurable = [];
export const product_default = {};
export const facet_min = 1;
// TODO: let user determine the negotiatable parameters
export const negotiatables = ["size", "duration"];