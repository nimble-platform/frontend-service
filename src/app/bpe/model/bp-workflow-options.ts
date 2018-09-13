import { BpSelectedProperties } from "./bp-selected-properties";
import { NegotiationOptions } from "../../catalogue/model/publish/negotiation-options";

export class BpWorkflowOptions {
    constructor(
        public selectedValues: BpSelectedProperties = {},
        public quantity: number = 1,
        public negotiation: NegotiationOptions = new NegotiationOptions()
    ) {}
}