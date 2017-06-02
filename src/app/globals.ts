'use strict';

export const debug=false;

export const endpoint="http://nimble-platform.salzburgresearch.at:443";
//export const endpoint="http://localhost:8080";
//export const endpoint="http://192.168.99.100:8080";
export const catalogue_endpoint="http://localhost:8095";

// "Motor" demo
//export const marmotta_endpoint="http://134.168.33.237:8080/marmotta/solr/fredo/select";
//export const product_name = "name";
//export const product_vendor = "manufacturer";
//export const product_img = "thumb";
//export const product_nonfilter_full = ["id","_version_"];
//export const product_nonfilter_regex = ["lmf.","_d","_s"];
//export const product_configurable = [];
//export const product_default = {};

// "Bathroom" demo
export const marmotta_endpoint="http://134.168.33.237:8080/marmotta/solr/Catalogue5/select";
export const product_name = "item_name";
export const product_vendor = "item_vendor_id";
export const product_img = "item_complete_images";
export const product_nonfilter_full = ["id","_version_","img_array"];
export const product_nonfilter_regex = ["lmf."];
export const product_configurable = ["wallTile_demo","floorTile_demo"];
export const product_default = {"floor":"White","wall":"White"};