import { Item } from "./item";
import { ThreadEventStatus } from "./thread-event-status";
import { ProcessType } from "../../../bpe/model/process-type";

export class ThreadEventMetadata {
    constructor(
        public processType: ProcessType,
        public presentableProcessType: string,
        public processId: string,
        public startTime: string,
        public tradingPartner: string,
        public product: Item,
        public note: string,
        public processStatus: string,
        public content: any,
        public activityVariables: any,
        public buyer: boolean,
        public isRated: boolean,
        public status?: ThreadEventStatus,
        public statusText?: string,
        public actionText?: string,
    ) {}
}