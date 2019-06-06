import {Quantity} from "./quantity";
import {Amount} from "./amount";

export class LCPAOutput {
    constructor(public lifeCycleCost: Amount = new Amount(),
                public operationCostsPerYear: Amount = new Amount(),
                public capexOpexRelation: Quantity = new Quantity()) {
    }
}