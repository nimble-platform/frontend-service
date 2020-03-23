import { ProcessInstanceGroup } from '../../bpe/model/process-instance-group';
import {CollaborationGroup} from '../../bpe/model/collaboration-group';

export class ProcessInstanceGroupResults {
    constructor(
        public processInstanceGroups: ProcessInstanceGroup[] = null,
        public collaborationGroupIds: string[] = null, // ids associated with the resultant process instance groups
        public hasArchivedGroups = false,
        public resultCount = 0
    ) {}
}
