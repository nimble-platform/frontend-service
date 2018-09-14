import {Party} from "./party";
import {TransportationService} from "./transportation-service";
import {Period} from "./period";
import {Consignment} from "./consignment";
import {Code} from "./code";
import {DocumentReference} from "./document-reference";
import {Contract} from "./contract";
/**
 * Created by suat on 10-Nov-17.
 */
export class TransportExecutionPlan {
    constructor(public id: string = null,
                public note: string[] = [''],
                public documentStatusCode: Code = new Code(),
                public documentStatusReasonCode: Code = new Code(),
                public transportUserParty:Party = new Party(),
                public transportServiceProviderParty:Party= new Party(),
                public transportExecutionPlanRequestDocumentReference: DocumentReference = new DocumentReference(),
                public additionalDocumentReference:DocumentReference[] = []) {
    }
}