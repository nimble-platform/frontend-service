/*
 * Copyright 2020
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
   In collaboration with
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

import { ProcessType } from "../model/process-type";
import {BpUserRole} from '../model/bp-user-role';

export class ActivityVariableParser {
    static getProcessType(processVariables): ProcessType {
        return processVariables[0]["processDefinitionKey"]
    }

    static getProcessInstanceId(processVariables): ProcessType {
        return processVariables["processInstanceId"]
    }

    static getUserRole(buyerPartyId:any,buyerFederationId:string,partyId:string,federationId:string){
        let role:BpUserRole = buyerPartyId == partyId && buyerFederationId == federationId ? 'buyer' : 'seller';
        return role;
    }

    static getPrecedingDocumentId(activityVariables:any){
        for(let activityVariable of activityVariables){
            if(activityVariable.name == "responseDocumentID"){
                return activityVariable.value;
            }
        }
        return null;
    }
}
