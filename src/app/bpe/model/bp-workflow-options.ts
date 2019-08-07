import { BpSelectedProperties } from "./bp-selected-properties";

export class BpWorkflowOptions {
    constructor(
        public selectedValues: BpSelectedProperties = {},
        public quantity: number = 1
    ) {}
}