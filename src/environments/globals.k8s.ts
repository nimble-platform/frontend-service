'use strict';

// Development variables

export const debug = false;


// Base path variables - SRFG staging

// export const base_path = "http://nimble-staging.salzburgresearch.at";
// export const ub_base = "http://nimble-staging.salzburgresearch.at/search";
// export const simple_search_endpoint="http://nimble-staging.salzburgresearch.at/marmotta/solr/catalogue2/select";
// export const pw_reset_link = "http://nimble-staging.salzburgresearch.at:8080/auth/realms/master/login-actions/reset-credentials?client_id=nimble_client";


// Base path variables - SRFG productive

// export const base_path = "https://nimble-platform.salzburgresearch.at/nimble";
// export const ub_path = "https://nimble-platform.salzburgresearch.at/ub-search";
// export const simple_search_endpoint="https://nimble-platform.salzburgresearch.at/marmotta/solr/catalogue2/select";
// export const pw_reset_link = "https://nimble-platform.salzburgresearch.at:8080/auth/realms/master/login-actions/reset-credentials?client_id=nimble_client";


// Base path variables - SRFG K8S

// export const base_path = "https://nimble.salzburgresearch.at";
// export const ub_base = "https://hydra2.ikap.biba.uni-bremen.de:8443";
// export const simple_search_endpoint="https://nimble-platform.salzburgresearch.at/marmotta/solr/catalogue2/select";
// export const pw_reset_link = "https://nimble-platform.salzburgresearch.at:8080/auth/realms/master/login-actions/reset-credentials?client_id=nimble_client";


// Base path variabled - K8S domain

export const base_path = "http://nimble.uk-south.containers.mybluemix.net";
export const ub_base = "https://hydra2.ikap.biba.uni-bremen.de:8443";
export const simple_search_endpoint="https://nimble-platform.salzburgresearch.at/marmotta/solr/catalogue2/select";
export const pw_reset_link = "https://nimble-platform.salzburgresearch.at:8080/auth/realms/master/login-actions/reset-credentials?client_id=nimble_client";


// Base path variables - Local development via service discovery

// export const base_path = "http://localhost:443";
// export const ub_path = "http://localhost:8090";
// export const simple_search_endpoint="http://nimble-staging.salzburgresearch.at/marmotta/solr/catalogue2/select";
// export const pw_reset_link = "http://nimble-staging.salzburgresearch.at:8080/auth/realms/master/login-actions/reset-credentials?client_id=nimble_client";


// Service endpoints

export const user_mgmt_endpoint=`${base_path}/identity`;
export const catalogue_endpoint=`${base_path}/catalog`;
export const bpe_endpoint=`${base_path}/business-process`;
export const data_channel_endpoint=`${base_path}/data-channel`;


// BIBA endpoints

export const languageEndPoint = `${ub_base}/getSupportedLanguages`;
export const endpoint = `${ub_base}/detectMeaningLanguageSpecific`;
export const logicalViewEndpoint = `${ub_base}/getLogicalView`;
export const propertyEndPoint = `/getPropertyValuesDiscretised`;
export const sparqlEndPoint = `${ub_base}/executeSPARQLSelect`;
export const sparqlOptionalSelectEndPoint = `${ub_base}/executeSPARQLOptionalSelect`;
export const spqButton = `${ub_base}/getSQPFromOrangeGroup`;
export const obs_propFromConcept = `${ub_base}/getPropertyFromConcept`;
export const obs_propValueFromConcept = `${ub_base}/getPropertyValuesFromGreenGroup`;
export const referenceFromConcept = `${ub_base}/getReferencesFromAConcept`;
export const sqpOrangeConcept = `${ub_base}/getPropertyValuesFromOrangeGroup`;


// TnT Endpoints

export const tntEndpoint = `${bpe_endpoint}/t-t/epc-details`;
export const tntAnalysisEndpoint = 'http://falcon-dev2.ikap.biba.uni-bremen.de:8118/simpleTrackingAnalysis/';


// Catalogue format variables

export const product_name = "item_name";
export const product_vendor_id = "item_manufacturer_id";
export const product_vendor_name = "item_manufacturer_name";
export const product_img = "item_image";
export const product_nonfilter_full = ["id","_version_","item_description","item_price","item_price_currency","item_commodity_classification_code","item_commodity_classification_uri"];
export const product_nonfilter_regex = ["lmf.","_id"];
export const product_configurable = [];
export const product_default = {};
export const facet_min = 1;
export const negotiatables = ["size", "duration"];
