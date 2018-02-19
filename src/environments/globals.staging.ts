'use strict';

// Development variables

export const debug=false;


// Endpoint variables - SRFG staging

export const user_mgmt_endpoint="http://nimble-staging.salzburgresearch.at/identity";
export const catalogue_endpoint="http://nimble-staging.salzburgresearch.at/catalog";
export const bpe_endpoint="http://nimble-staging.salzburgresearch.at/business-process";


// Endpoint variables - SRFG productive

//export const user_mgmt_endpoint="https://nimble-platform.salzburgresearch.at/nimble/identity";
//export const catalogue_endpoint="https://nimble-platform.salzburgresearch.at/nimble/catalog";
//export const bpe_endpoint="https://nimble-platform.salzburgresearch.at/nimble/business-process";


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

// const ub_base_8090="http://hydra2.ikap.biba.uni-bremen.de:8090";
// const ub_base_8092="http://hydra2.ikap.biba.uni-bremen.de:8092";
// const ub_base_8090="https://nimble-platform.salzburgresearch.at/uni-bremen-8090";
// const ub_base_8092="https://nimble-platform.salzburgresearch.at/uni-bremen-8092";
// export const languageEndPoint = `${ub_base_8090}/getSupportedLanguages`;
export const languageEndPoint = "https://hydra2.ikap.biba.uni-bremen.de:8443/getSupportedLanguages";
// export const endpoint = "http://localhost:8090/detectMeaningLanguageSpecific";
// export const endpoint = `${ub_base_8092}/detectMeaningLanguageSpecific`;
export const endpoint = "https://hydra2.ikap.biba.uni-bremen.de:8443/detectMeaningLanguageSpecific";
// export const logicalViewEndpoint = `${ub_base_8092}/getLogicalView`;
// export const logicalViewEndpoint = "http://localhost:8090/getLogicalView";
export const logicalViewEndpoint = "https://hydra2.ikap.biba.uni-bremen.de:8443/getLogicalView";
// export const propertyEndPoint = "http://localhost:8090/getPropertyValuesDiscretised";
// export const propertyEndPoint = `${ub_base_8092}/getPropertyValuesDiscretised`;
export const propertyEndPoint = "https://hydra2.ikap.biba.uni-bremen.de:8443/getPropertyValuesDiscretised";
// export const sparqlEndPoint = `${ub_base_8092}/executeSPARQLSelect`;
// export const sparqlEndPoint = 'http://localhost:8090/executeSPARQLSelect';
export const sparqlEndPoint = "https://hydra2.ikap.biba.uni-bremen.de:8443/executeSPARQLSelect";
// export const sparqlOptionalSelectEndPoint = "http://localhost:8090/executeSPARQLOptionalSelect";
// export const sparqlOptionalSelectEndPoint = `${ub_base_8092}/executeSPARQLOptionalSelect`;
export const sparqlOptionalSelectEndPoint = "https://hydra2.ikap.biba.uni-bremen.de:8443/executeSPARQLOptionalSelect";
export const spqButton = "https://hydra2.ikap.biba.uni-bremen.de:8443/getSQPFromOrangeGroup";
export const obs_propFromConcept = "https://hydra2.ikap.biba.uni-bremen.de:8443/getPropertyFromConcept";
export const obs_propValueFromConcept = "https://hydra2.ikap.biba.uni-bremen.de:8443/getPropertyValuesFromGreenGroup";
export const referenceFromConcept = "https://hydra2.ikap.biba.uni-bremen.de:8443/getReferencesFromAConcept";
export const sqpOrangeConcept = "https://hydra2.ikap.biba.uni-bremen.de:8443/getPropertyValuesFromOrangeGroup";


// Catalogue format variables

export const product_name = "item_name";
export const product_vendor_id = "item_manufacturer_id";
export const product_vendor_name = "item_manufacturer_name";
export const product_img = "thumb";
export const product_nonfilter_full = ["id","_version_"];
export const product_nonfilter_regex = ["lmf.","_id"];
export const product_configurable = [];
export const product_default = {};
export const facet_min = 1;
// TODO: let user determine the negotiatable parameters
export const negotiatables = ["size", "duration"];