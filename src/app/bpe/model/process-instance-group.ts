/**
 * Created by suat on 05-Mar-18.
 */
export class ProcessInstanceGroup {
    constructor(public id: string = "",
                public status:string,
                public name:string,
                public partyID: string = "",
                public processInstanceIDs: string[],
                public archived: boolean = false,
                public collaborationRole: string = "",
                public associatedGroups: ProcessInstanceGroup[]) {
    }
}