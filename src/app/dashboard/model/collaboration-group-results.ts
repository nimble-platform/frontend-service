import { ProcessInstanceGroup } from '../../bpe/model/process-instance-group';
import {CollaborationGroup} from '../../bpe/model/collaboration-group';

export class CollaborationGroupResults {
    constructor(
        public collaborationGroups: CollaborationGroup[] = null,
        public hasArchivedGroups = false,
        public resultCount: number = 0
    ) {}
}
