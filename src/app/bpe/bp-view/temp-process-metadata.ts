import { Item } from "../../catalogue/model/publish/item";

// TODO this should be removed once ux-updates is merged.
export interface ProcessMetatada {
    processType: string;
    presentableProcessType: string;
    process_id: string;
    start_time: string;
    tradingPartner: string;
    product: Item;
    note: string;
    processStatus: "Started" | "Completed";
    statusCode: string;
    actionStatus: string;
    content: any;
    activityVariables: any;
}
