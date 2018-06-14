import { BpSelectedProperties } from "./bp-selected-properties";
import { BpNegotiationOptions } from "./bp-negotiation-options";

export class BpWorkflowOptions {
    constructor(
        public selectedValues: BpSelectedProperties = {},
        public quantity: number = 1,
        public negotiation: BpNegotiationOptions = new BpNegotiationOptions()
    ) {}
}