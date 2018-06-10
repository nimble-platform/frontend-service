import {Item} from "../../catalogue/model/publish/item";

export interface ThreadEvent {
    processType: string;
    presentableProcessType: string;
    processId: string;
    startTime: string;
    tradingPartner: string;
    product: Item;
    note: string;
    processStatus: string;
    statusCode: "EXTERNALLY_TERMINATED" | "COMPLETED" | "ACTIVE";
    actionStatus: string;
    content: any;
    activityVariables: any; 
}