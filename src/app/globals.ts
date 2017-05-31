'use strict';

export const debug=false;

export const endpoint="http://nimble-platform.salzburgresearch.at:443";
//export const endpoint="http://localhost:8080";
//export const endpoint="http://192.168.99.100:8080";
export const catalogue_endpoint="http://localhost:8095";
export const marmotta_endpoint="http://134.168.33.237:8080/marmotta/solr/fredo/select";

export const product_name = "name";
export const product_vendor = "manufacturer";
export const product_img = "thumb";
export const product_nonfilter_full = ["id","_version_"];
export const product_nonfilter_regex = ["lmf.","_d","_s"];