import {BpUserRole} from '../../../bpe/model/bp-user-role';
import {ProcessType} from '../../../bpe/model/process-type';

export class BpStartEvent{
    constructor(
        public userRole: BpUserRole = null,
        public processType: ProcessType = null,
        public containerGroupId: string = null, // identifier of the business process instance group which contains the new process being initiated
        public collaborationGroupId: string = null // identifier of the collaboration group which process instance group belongs to
    ){}
}