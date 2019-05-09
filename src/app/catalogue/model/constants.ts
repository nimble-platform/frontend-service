import { Option } from "../../common/options-input.component";

export const INCOTERMS: string[] = [
    "",
    "CIF (Cost, Insurance and Freight)",
    "CIP (Carriage and Insurance Paid to)",
    "CFR (Cost and Freight)",
    "CPT (Carriage paid to)",
    "DAT (Delivered at Terminal)",
    "DAP (Delivered at Place)",
    "DDP (Delivery Duty Paid)",
    "EXW (Ex Works)",
    "FAS (Free Alongside Ship)",
    "FCA (Free Carrier)",
    "FOB (Free on Board)"
];

export const PAYMENT_MEANS: string[] = [
    "Credit Card",
    "ACH Transfer",
    "Wire Transfer",
    "Cash On Delivery"
]

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
    { name: "PRICE_LOW_TO_HIGH", value: "Price:Low to High"},
    { name: "PRICE_HIGH_TO_LOW", value: "Price:High to Low"}
]

export const FAVOURITE_LINEITEM_PUT_OPTIONS = [
    { name: "ITEM_PUT", value: 1},
    { name: "LIST_REMOVE", value: 2}
]

export const CUSTOM_PROPERTY_LIST_ID = "Custom";

export const PROPERTY_TYPES: Option[] = [
    { name: "Text", value: "STRING" },
    { name: "Number", value: "NUMBER" },
    { name: "Image", value: "BINARY" },
    { name: "File", value: "BINARY" },
    { name: "Quantity", value: "QUANTITY" },
    { name: "Boolean", value: "BOOLEAN" },
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
    ORDERED_QUANTITY: {text:'Ordered Quantity',typeID:1},
    PRODUCT_PROPERTY: {text:'Product Property',typeID:2},
    DELIVERY_PERIOD: {text:'Delivery Period',typeID:4},
    INCOTERM: {text:'Incoterm',typeID:8},
    PAYMENT_MEAN: {text:'Payment Mean',typeID:16},
    DELIVERY_LOCATION: {text:'Delivery Location',typeID:32}
};

export const DISCOUNT_TARGETS = {
    TOTAL_PRICE: 'Total Price',
    PER_UNIT: 'Per Unit'
};

export const DISCOUNT_UNITS = CURRENCIES.concat(['%']);

export const LANGUAGES:Array<string>  = ["en", "es", "de", "tr", "it"];

export const DEFAULT_LANGUAGE = function () {
    let languageId = navigator.language.indexOf('-') == -1 ? navigator.language : navigator.language.substring(0,navigator.language.indexOf('-'));
    if(LANGUAGES.indexOf(languageId) == -1){
        return "en";
    }
    return languageId;
};