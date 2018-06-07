import {ProcessInstanceGroup} from "./process-instance-group";
/**
 * Created by suat on 05-Mar-18.
 */
export class ProcessInstanceGroupResponse {
    constructor(public size: number = 0,
                public processInstanceGroups: ProcessInstanceGroup[] = []) {
    }
}