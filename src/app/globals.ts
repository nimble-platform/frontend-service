'use strict';

// Development variables

export const debug=false;


// Endpoint variables - SRFG domain

export const user_mgmt_endpoint="http://nimble-platform.salzburgresearch.at:443/identity";
export const catalogue_endpoint="http://nimble-platform.salzburgresearch.at:443/catalog";
export const bpe_endpoint="http://nimble-platform.salzburgresearch.at:443/business-process";


// Endpoint variables - BIBA domain

export const endpoint = 'http://hydra2.ikap.biba.uni-bremen.de:8090/detectMeaning';
export const logicalViewEndpoint = 'http://hydra2.ikap.biba.uni-bremen.de:8090/getLogicalView';


// Endpoint variables - Local development via service discovery

//export const user_mgmt_endpoint="http://localhost:443/identity";
//export const catalogue_endpoint="http://localhost:443/catalog";
//export const bpe_endpoint="http://localhost:443/business-process";


// Endpoint variables - Local development with VM via service discovery

//export const user_mgmt_endpoint="http://192.168.99.100:443/identity";
//export const catalogue_endpoint="http://192.168.99.100:443/catalog";
//export const bpe_endpoint="http://192.168.99.100:443/business-process";


// Endpoint variables - Local development direct links

//export const user_mgmt_endpoint="http://localhost:9096";
//export const catalogue_endpoint="http://localhost:8095";
//export const bpe_endpoint="http://localhost:8081";
//export const endpoint = 'http://localhost:8090/detectMeaning'; // for local catalog search service
//export const logicalViewEndpoint = 'http://localhost:8090/getLogicalView'; // for visualization


// Marmotta endpoint variables

export const simple_search_endpoint="http://134.168.33.237:8080/marmotta/solr/Catalogue/select";
//export const simple_search_endpoint="http://134.168.33.237:8080/marmotta/solr/fredo/select";


// Catalogue format variables - "Bathroom" demo

//export const product_name = "item_name";
//export const product_vendor_id = "item_vendor_id";
//export const product_vendor_name = "item_vendor_name";
//export const product_img = "item_complete_images";
//export const product_nonfilter_full = ["id","_version_","img_array"];
//export const product_nonfilter_regex = ["lmf."];
//export const product_configurable = ["wallTile_demo","floorTile_demo"];
//export const product_default = {"floor":"White","wall":"White"};
//export const facet_min = 1;


// Catalogue format variables - "Motor" demo

//export const product_name = "name";
//export const product_vendor_id = "manufacturer";
//export const product_vendor_name = "manufacturer";
//export const product_img = "thumb";
//export const product_nonfilter_full = ["id","_version_"];
//export const product_nonfilter_regex = ["lmf.","_d","_s"];
//export const product_configurable = [];
//export const product_default = {};
//export const facet_min = 2;

// review
export const product_name = "item_name";
export const product_vendor_id = "item_manufacturer_id";
export const product_vendor_name = "item_manufacturer_name";
export const product_img = "thumb";
export const product_nonfilter_full = ["id","_version_"];
export const product_nonfilter_regex = ["lmf.","_id"];
export const product_configurable = [];
export const product_default = {};
export const facet_min = 1;
//TODO let user determine the negotiatable parameters
export const negotiatables = ["price", "size", "duration"];