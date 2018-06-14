import { Incoterms } from "./publish/incoterms";

export const INCOTERMS: Incoterms[] = [
    { label: "None", value: "" },
    { label: "CIF (Cost, Insurance and Freight)", value: "CIF" },
    { label: "CIP (Carriage and Insurance Paid to)", value: "CIP" },
    { label: "CFR (Cost and Freight)", value: "CFR" },
    { label: "CPT (Carriage paid to)", value: "CPT" },
    { label: "DAT (Delivered at Terminal)", value: "DAT" },
    { label: "DAP (Delivered at Place)", value: "DAP" },
    { label: "DDP (Delivery Duty Paid)", value: "DDP" },
    { label: "EXW (Ex Works)", value: "EXW" },
    { label: "FAS (Free Alongside Ship)", value: "FAS" },
    { label: "FCA (Free Carrier)", value: "FCA" },
    { label: "FOB (Free on Board)", value: "FOB" }
];
