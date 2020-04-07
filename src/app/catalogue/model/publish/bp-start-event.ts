/*
 * Copyright 2020
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
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

import {BpUserRole} from '../../../bpe/model/bp-user-role';
import {ProcessType} from '../../../bpe/model/process-type';
import {ThreadEventMetadata} from './thread-event-metadata';
import {Item} from "./item";
import {Quantity} from "./quantity";

export class BpActivityEvent{
    constructor(
        public userRole: BpUserRole = null,
        public processType: ProcessType = null,
        public containerGroupId: string = null, // identifier of the business process instance group which contains the new process being initiated
        public processMetadata: ThreadEventMetadata = null, // details of the continued process
        public processHistory: ThreadEventMetadata[] = [], // business processes history. if an existing business process continues, the history contains the current step also
        public itemsWithSelectedProperties: Item[] = null, // selected properties of the product (in the search-details page)
        public itemQuantity: Quantity = null, // order amount of the product. This property is of interest while initiating a new business process.
        public newProcess: boolean = null, // true indicates that a new process is about the to be started
        // parameters previously passed via the BPUrlParams
        public catalogueIds = null,
        public catalogueLineIds = null,
        public previousProcessInstanceId = null,
        public previousDocumentId = null,
        public termsSources: ('product_defaults' | 'frame_contract')[] = null,
        public sellerFederationId:string = null,
        public precedingOrderId = null, // identifier of the Order for which the transport service related processes are started
        public processMetadataOfAssociatedOrder:ThreadEventMetadata = null, // activity variables of the associated order
        public unShippedOrderIds:string[] = null // identifiers of associated unshipped orders
    ){}
}
