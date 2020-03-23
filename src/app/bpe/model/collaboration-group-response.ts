import {CollaborationGroup} from './collaboration-group';
/**
 * Created by suat on 05-Mar-18.
 */
export class CollaborationGroupResponse {
    constructor(public size: number = 0,
                public collaborationGroups: CollaborationGroup[] = []) {
    }
}