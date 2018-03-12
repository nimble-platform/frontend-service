/**
 * Created by suat on 05-Mar-18.
 */
export class ProcessInstanceGroup {
    constructor(public id: string,
                public partyId: string,
                public processInstanceIds: string[],
                public archived: boolean,
                public collaborationRole: string) {
    }
}