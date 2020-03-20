import { ThreadEventStatus } from "./thread-event-status";
import { ProcessType } from "../../../bpe/model/process-type";

// TODO move this class to an appropriate package under BP directory
export class ThreadEventMetadata {
    constructor(
        public processType: ProcessType,
        public presentableProcessType: string,
        public processInstanceId: string,
        public startTime: string,
        public products: any, // this object holds some information about the products such as catalog and line ids, product names and whether they are transport services or not
        public correspondentUserIdFederationId: string[], // array consisting of two entries, one is user id, the other is its federation id
        public processStatus: string,
        public buyerPartyId: any,
        public activityVariables: any,
        public buyer: boolean,
        public isRated: boolean,
        public areProductsDeleted : boolean[],
        public collaborationStatus: string,
        public sellerFederationId:string,
        public cancellationReason:string,
        public requestDate:string,
        public responseDate:string,
        public completionDate:string,
        public isBeingUpdated: boolean = false, // It's true only while the process instance is being updated.
        public status?: ThreadEventStatus,
        public statusText?: string,
        public actionText?: string,
        public formerStep?: boolean
    ) {}
}
