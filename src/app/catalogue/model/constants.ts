/*
 * Copyright 2020
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
   In collaboration with
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
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

import { Option } from "../../common/options-input.component";
import * as myGlobals from '../../globals';

export const INCOTERMS: string[] = [
    "",
    "CIF (Cost, Insurance and Freight)",
    "CIP (Carriage and Insurance Paid to)",
    "CFR (Cost and Freight)",
    "CPT (Carriage paid to)",
    "DAP (Delivered at Place)",
    "DDP (Delivery Duty Paid)",
    "DPU (Delivery at Place Unloaded)",
    "EXW (Ex Works)",
    "FAS (Free Alongside Ship)",
    "FCA (Free Carrier)",
    "FOB (Free on Board)"
];

export const PAYMENT_MEANS = myGlobals.config.paymentMeans;

export const NEGOTIATION_RESPONSES = {
    ACCEPTED: "Accepted",
    TERMS_UPDATED: "Terms Updated",
    REJECTED: "Rejected"
}

export const CURRENCIES = [
    "EUR",
    "USD",
    "SEK"
]

export const CATALOGUE_LINE_SORT_OPTIONS = [
    { name: "PRICE_LOW_TO_HIGH", value: "Price:Low to High" },
    { name: "PRICE_HIGH_TO_LOW", value: "Price:High to Low" }
]

export const CATALOGUE_LINE_STATUS = [
    "PUBLISHED",
    "DRAFT"
];

export const FAVOURITE_LINEITEM_PUT_OPTIONS = [
    { name: "ITEM_PUT", value: 1 },
    { name: "LIST_REMOVE", value: 2 }
]

export const CUSTOM_PROPERTY_LIST_ID = "Custom";

export const PROPERTY_TYPES: Option[] = [
    { name: "Text", value: "STRING" },
    { name: "Number", value: "NUMBER" },
    { name: "Image", value: "FILE" },
    { name: "File", value: "FILE" },
    { name: "Quantity", value: "QUANTITY" },
    { name: "Boolean", value: "BOOLEAN" },
]

export const SOCIAL_MEDIA_CLASSES = [
    { url: "facebook.com", class: "input-group-prepend input-group-text fab fa-facebook-f facebook-icon fa-1x" },
    { url: "twitter.com", class: "input-group-prepend input-group-text fab fa-twitter twitter-icon fa-1x" },
    { url: "instagram.com", class: "input-group-prepend input-group-text fab fa-instagram instagram-icon fa-1x" },
    { url: "youtube.com", class: "input-group-prepend input-group-text fab fa-youtube youtube-icon fa-1x" },
    { url: "pinterest.com", class: "input-group-prepend input-group-text fab fa-pinterest pinterest-icon fa-1x" },
    { url: "linkedin.com", class: "input-group-prepend input-group-text fab fa-linkedin-in linkedin-icon fa-1x" },
    { url: "tumblr.com", class: "input-group-prepend input-group-text fab fa-tumblr tumblr-icon fa-1x" },
    { url: "reddit.com", class: "input-group-prepend input-group-text fab fa-reddit reddit-icon fa-1x" }
]

export const PROCESSES = [
    { id: "Item_Information_Request", name: "Item Information Request", tooltip: "Allows buyers to request additional information regarding a product / service" },
    { id: "Ppap", name: "PPAP", tooltip: "Production part approval process (specific sectors only)" },
    { id: "Negotiation", name: "Negotiation", tooltip: "Allows buyers to negotiate the terms of a product / service" },
    { id: "Order", name: "Order", tooltip: "Required to allow ordering of products" },
    { id: "Transport_Execution_Plan", name: "Transport Execution Plan", tooltip: "Covers the logistics-related step of the workflow" },
    { id: "Fulfilment", name: "Fulfilment", tooltip: "Final step to confirm the success or report on problems" },
]

export const TRANSPORT_SERVICE_CATEGORY_NAME = "Transport service"

export const PPAP_CERTIFICATES = [
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
    "Sample Production Parts"
];

export const REGIONS = [
    "Europe",
    "Asia",
    "Africa",
    "North America",
    "South America",
    "Oceania"
]

export const PRICE_OPTIONS = {
    ORDERED_QUANTITY: { text: 'Ordered Quantity', typeID: 1 },
    PRODUCT_PROPERTY: { text: 'Product Property', typeID: 2 },
    DELIVERY_PERIOD: { text: 'Delivery Period', typeID: 4 },
    INCOTERM: { text: 'Incoterm', typeID: 8 },
    PAYMENT_MEAN: { text: 'Payment Mean', typeID: 16 },
    DELIVERY_LOCATION: { text: 'Delivery Location', typeID: 32 }
};

export const DISCOUNT_TARGETS = {
    TOTAL_PRICE: 'Total Price',
    PER_UNIT: 'Per Unit'
};

export const DISCOUNT_UNITS = CURRENCIES.concat(['%']);

export const FEDERATION = function() {
    let fed = document.getElementsByTagName('html')[0].getAttribute('data-fed');
    if (!myGlobals.config.delegationEnabled || !fed)
        fed = "OFF";
    return fed;
}

export const FEDERATIONID = function() {
    return myGlobals.config.federationInstanceId;
}

export const LANGUAGES: Array<string> = myGlobals.config.languageSettings.available;

export const DEFAULT_LANGUAGE = function() {
    return document.getElementsByTagName('html')[0].getAttribute('lang');
};

export const FALLBACK_LANGUAGE: string = myGlobals.config.languageSettings.fallback;

// constants identifiers of non-public information fields
export const NON_PUBLIC_FIELD_ID = {
    WARRANTY_PERIOD: "WARRANTY_PERIOD",
    INCOTERMS: "INCOTERMS",
    DELIVERY_PERIOD: "DELIVERY_PERIOD",
    SPECIAL_TERMS: "SPECIAL_TERMS",
    QUANTITY_PER_PACKAGE: "QUANTITY_PER_PACKAGE",
    PACKAGING_TYPE: "PACKAGING_TYPE",
    CUSTOMIZABLE: "CUSTOMIZABLE",
    SPARE_PART: "SPARE_PART",
    DEFAULT_PRICE: "DEFAULT_PRICE",
    VAT: "VAT",
    MINIMUM_ORDER_QUANTITY: "MINIMUM_ORDER_QUANTITY",
    FREE_SAMPLE: "FREE_SAMPLE",
    CIRCULAR_ECONOMY_CERTIFICATES:"CIRCULAR_ECONOMY_CERTIFICATES",
    OTHER_PRODUCT_CERTIFICATES: "OTHER_PRODUCT_CERTIFICATES",
    DISCOUNT_CHARGES: "DISCOUNT_CHARGES"
}
