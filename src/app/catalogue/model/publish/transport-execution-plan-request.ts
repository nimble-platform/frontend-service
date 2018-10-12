import {Party} from "./party";
import {Period} from "./period";
import {Consignment} from "./consignment";
import {Location} from "./location";
import {Item} from "./item";
import {Contract} from "./contract";
import {DocumentReference} from './document-reference';
/**
 * Created by suat on 10-Nov-17.
 */
export class TransportExecutionPlanRequest {
    constructor(
        public id:string = null,
        public note: string[] = [''],
        public transportUserParty:Party = new Party(),
        public transportContract: Contract = null,
        public transportServiceProviderParty:Party= new Party(),
        public mainTransportationService:Item = new Item(),
        public serviceStartTimePeriod:Period = new Period(),
        public serviceEndTimePeriod:Period = new Period(),
        public fromLocation:Location = new Location(),
        public toLocation:Location = new Location(),
        public consignment:Consignment[] = [new Consignment()],
        public additionalDocumentReference:DocumentReference[] = []
    ) {  }
}