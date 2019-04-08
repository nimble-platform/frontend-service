import { ProcessType } from "../model/process-type";
import {UBLModelUtils} from '../../catalogue/model/ubl-model-utils';
import {BpUserRole} from '../model/bp-user-role';
/**
 * Created by suat on 24-Oct-17.
 */

export class ActivityVariableParser {
    static getProcessType(processVariables): ProcessType {
        return processVariables[0]["processDefinitionKey"]
    }

    static getTradingPartnerName(initialDocument: any, partyId: string, processType: string): string {
        if(initialDocument.buyerPartyId == partyId){
            return UBLModelUtils.getPartyDisplayNameForPartyName(initialDocument.sellerPartyName);
        } else{
            return UBLModelUtils.getPartyDisplayNameForPartyName(initialDocument.buyerPartyName);
        }
    }

    static getUserRole(processType:string,initialDocument:any,partyId:string){
        let buyerId:any = initialDocument.buyerPartyId;
        let role:BpUserRole = buyerId == partyId ? 'buyer' : 'seller';
        return role;
    }
}
