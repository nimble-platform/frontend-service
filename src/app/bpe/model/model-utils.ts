import {ProcessVariables} from "./process-variables";
import {UBLModelUtils} from "../../catalogue/model/ubl-model-utils";
/**
 * Created by suat on 23-Aug-17.
 */
export class ModelUtils {
    public static createProcessVariables(processId:string, initiatorId:string, responderId:string, content:any):ProcessVariables {
        UBLModelUtils.removeHjidFieldsFromObject(content);
        let vars:ProcessVariables = new ProcessVariables(processId, initiatorId, responderId, this.generateUUID(), JSON.stringify(content));
        return vars;
    }

    private static generateUUID(): string {
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    };
}
