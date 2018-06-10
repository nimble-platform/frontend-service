import {Item} from "../../catalogue/model/publish/item";
import { ThreadEventStatus } from "./thread-event-status";

export class ThreadEvent {
    constructor(
        public processType: string,
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
        public status?: ThreadEventStatus,
        public statusText?: string,
        public actionText?: string,
    ) {}
}