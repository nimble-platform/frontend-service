import { SelectedPropertyValues } from "./selected-property-values";
import { NegotiationOptions } from "./negotiation-options";

export class WorkflowOptions {
    constructor(
        public selectedValues: SelectedPropertyValues = {},
        public quantity: number = 1,
        public negotiation: NegotiationOptions = new NegotiationOptions()
    ) {}
}