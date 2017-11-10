import {Party} from "./party";
import {TransportationService} from "./transportation-service";
import {Period} from "./period";
import {Consignment} from "./consignment";
import {Code} from "./code";
/**
 * Created by suat on 10-Nov-17.
 */
export class TransportExecutionPlan {
    constructor(public id: string = null,
                public note: string[] = [''],
                public documentStatusCode: Code = new Code(),
                public documentStatusReasonCode: Code = new Code()) {
    }
}