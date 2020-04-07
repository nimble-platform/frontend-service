/*
 * Copyright 2020
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
   In collaboration with
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

import {Injectable} from "@angular/core";
import "rxjs/add/operator/toPromise";
import { ThreadEventMetadata } from "../catalogue/model/publish/thread-event-metadata";
import {ActivityVariableParser} from '../bpe/bp-view/activity-variable-parser';

@Injectable()
export class SearchContextService {
	private associatedProcessMetadata:ThreadEventMetadata;
	// For transport-related process instance groups, we need to know the preceding order id
    // since we need order details to create a valid transport execution plan or transport negotiation
	private precedingOrderId: string;

	public setSearchContext(associatedProcessMetadata:ThreadEventMetadata):void{
	    this.associatedProcessMetadata = associatedProcessMetadata;
	    this.precedingOrderId = ActivityVariableParser.getPrecedingDocumentId(associatedProcessMetadata.activityVariables);
    }

    public getAssociatedProcessMetadata():ThreadEventMetadata{
	    return this.associatedProcessMetadata;
    }

    public getPrecedingOrderId():string{
	    return this.precedingOrderId;
    }
}
