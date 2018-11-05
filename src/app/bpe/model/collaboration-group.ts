import {ProcessInstanceGroup} from './process-instance-group';

export class CollaborationGroup {
    constructor(public id: string = "",
                public status:string,
                public name: string = "",
                public archived: boolean = false,
                public associatedProcessInstanceGroups: ProcessInstanceGroup[]) {
    }
}