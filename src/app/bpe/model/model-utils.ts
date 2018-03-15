import {ProcessVariables} from "./process-variables";
import {UBLModelUtils} from "../../catalogue/model/ubl-model-utils";
/**
 * Created by suat on 23-Aug-17.
 */
export class ModelUtils {
    public static createProcessVariables(processId:string, initiatorId:string, responderId:string, content:any):ProcessVariables {
        UBLModelUtils.removeHjidFieldsFromObject(content);
        let vars:ProcessVariables = new ProcessVariables(processId, initiatorId, responderId,UBLModelUtils.generateUUID(), JSON.stringify(content));
        return vars;
    }


}
