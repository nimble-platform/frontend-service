import {LineItem} from "../../catalogue/model/publish/line-item";
/**
 * Created by suat on 23-Aug-17.
 */
export class ProcessInstance {
    constructor(public processInstanceID: string = "",
                public processID: string = "",
                public creationDate: string = "",
                public status: string = "") {
    }
}
