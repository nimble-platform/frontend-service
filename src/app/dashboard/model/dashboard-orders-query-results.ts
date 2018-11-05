import { ProcessInstanceGroup } from "../../bpe/model/process-instance-group";
import {CollaborationGroup} from '../../bpe/model/collaboration-group';

export class DashboardOrdersQueryResults {
    constructor(
        public orders: CollaborationGroup[] = null,
        public hasArchivedOrders: boolean = false,
        public resultCount: number = 0
    ) {}
}