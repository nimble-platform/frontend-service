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

import { ThreadEventStatus } from "./thread-event-status";
import { ProcessType } from "../../../bpe/model/process-type";

// TODO move this class to an appropriate package under BP directory
export class ThreadEventMetadata {
    constructor(
        public processType: ProcessType,
        public presentableProcessType: string,
        public processInstanceId: string,
        public startTime: string,
        public products: any, // this object holds some information about the products such as catalog and line ids, product names and whether they are transport services or not
        public correspondentUserIdFederationId: string[], // array consisting of two entries, one is user id, the other is its federation id
        public processStatus: string,
        public buyerPartyId: any,
        public activityVariables: any,
        public buyer: boolean,
        public isRated: boolean,
        public areProductsDeleted: boolean[],
        public collaborationStatus: string,
        public sellerFederationId: string,
        public cancellationReason: string,
        public requestDate: string,
        public responseDate: string,
        public completionDate: string,
        public isBeingUpdated: boolean = false, // It's true only while the process instance is being updated.
        public status?: ThreadEventStatus,
        public statusText?: string,
        public actionText?: string,
        public formerStep?: boolean,
        public responseStatus?: string // whether the request is accepted,rejected or updated
    ) { }
}
