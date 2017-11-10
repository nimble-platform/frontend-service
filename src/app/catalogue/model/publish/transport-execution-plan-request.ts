import {Party} from "./party";
import {TransportationService} from "./transportation-service";
import {Period} from "./period";
import {Consignment} from "./consignment";
/**
 * Created by suat on 10-Nov-17.
 */
export class TransportExecutionPlanRequest {
    constructor(
        public id:string = null,
        public note: string[] = [''],
        public transportUserParty:Party = new Party(),
        public transportServiceProviderParty:Party= new Party(),
        public serviceStartTimePeriod:Period = new Period(),
        public serviceEndTimePeriod:Period = new Period(),
        public fromLocation:Location = new Location(),
        public toLocation:Location = new Location(),
        public consignment:Consignment = new Consignment()
    ) {  }
}