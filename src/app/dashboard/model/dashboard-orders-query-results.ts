import { ProcessInstanceGroup } from "../../bpe/model/process-instance-group";

export class DashboardOrdersQueryResults {
    constructor(
        public orders: ProcessInstanceGroup[] = null,
        public hasArchivedOrders: boolean = false,
        public resultCount: number = 0
    ) {}
}