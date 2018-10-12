import {ProcessVariables} from "./process-variables";
import {UBLModelUtils} from "../../catalogue/model/ubl-model-utils";
import {BPDataService} from "../bp-view/bp-data-service";
/**
 * Created by suat on 23-Aug-17.
 */
export class ModelUtils {
    public static createProcessVariables(processId:string, initiatorId:string, responderId:string, creatorUserID:string,content:any, bpDataService: BPDataService):ProcessVariables {
        UBLModelUtils.removeHjidFieldsFromObject(content);
        let vars:ProcessVariables = new ProcessVariables(processId, initiatorId, responderId, content.id, creatorUserID,bpDataService.relatedProducts, bpDataService.relatedProductCategories, JSON.stringify(content));
        return vars;
    }


}
