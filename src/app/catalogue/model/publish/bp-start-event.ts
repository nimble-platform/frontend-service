import {BpUserRole} from '../../../bpe/model/bp-user-role';
import {ProcessType} from '../../../bpe/model/process-type';
import {ThreadEventMetadata} from './thread-event-metadata';
import {BpWorkflowOptions} from '../../../bpe/model/bp-workflow-options';

export class BpActivityEvent{
    constructor(
        public userRole: BpUserRole = null,
        public processType: ProcessType = null,
        public containerGroupId: string = null, // identifier of the business process instance group which contains the new process being initiated
        public processMetadata: ThreadEventMetadata = null, // details of the continued process
        public processHistory: ThreadEventMetadata[] = [], // business processes history. if an existing business process continues, the history contains the current step also
        public workflowOptions: BpWorkflowOptions = null, // selected properties of the product (in the search-details page) and negotiation details (in negotiation request page)
        public newProcess: boolean = null, // true indicates that a new process is about the to be started
        public formerProcess: boolean = null, // true indicates that the process has subsequent processes in the history
        // parameters previously passed via the BPUrlParams
        public catalogueId = null,
        public catalogueLineId = null,
        public previousProcessInstanceId = null,
        public previousDocumentId = null,
        public termsSource: 'product_defaults' | 'frame_contract' = null
    ){}
}