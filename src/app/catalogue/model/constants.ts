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
    "USD"
]

export const CUSTOM_PROPERTY_LIST_ID = "Custom";

export const PROPERTY_TYPES: Option[] = [
    { name: "Text", value: "STRING" },
    { name: "Number", value: "REAL_MEASURE" },
    { name: "Image", value: "BINARY" },
    { name: "File", value: "BINARY" },
    { name: "Quantity", value: "QUANTITY" },
    { name: "Boolean", value: "BOOLEAN" },
]

export const TRANSPORT_SERVICE_CATEGORY_NAME = "Transport service"