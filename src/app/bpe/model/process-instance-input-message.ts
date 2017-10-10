import {ProcessVariables} from "./process-variables";
/**
 * Created by suat on 23-Aug-17.
 */
export class ProcessInstanceInputMessage {
    constructor(public variables: ProcessVariables,
                public processInstanceID: string) {
    }
}