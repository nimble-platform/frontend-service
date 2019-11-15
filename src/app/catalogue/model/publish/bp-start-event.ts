import {BpUserRole} from '../../../bpe/model/bp-user-role';
import {ProcessType} from '../../../bpe/model/process-type';
import {ThreadEventMetadata} from './thread-event-metadata';
import {Item} from "./item";
import {Quantity} from "./quantity";

export class BpActivityEvent{
    constructor(
        public userRole: BpUserRole = null,
        public processType: ProcessType = null,
        public containerGroupId: string = null, // identifier of the business process instance group which contains the new process being initiated
        public processMetadata: ThreadEventMetadata = null, // details of the continued process
        public processHistory: ThreadEventMetadata[] = [], // business processes history. if an existing business process continues, the history contains the current step also
        public itemsWithSelectedProperties: Item[] = null, // selected properties of the product (in the search-details page)
        public itemQuantity: Quantity = null, // order amount of the product. This property is of interest while initiating a new business process.
        public newProcess: boolean = null, // true indicates that a new process is about the to be started
        // parameters previously passed via the BPUrlParams
        public catalogueIds = null,
        public catalogueLineIds = null,
        public previousProcessInstanceId = null,
        public previousDocumentId = null,
        public termsSources: ('product_defaults' | 'frame_contract')[] = null,
        public precedingOrderId = null, // identifier of the Order for which the transport service related processes are started
        public activityVariablesOfAssociatedOrder = null // activity variables of the associated order
    ){}
}
