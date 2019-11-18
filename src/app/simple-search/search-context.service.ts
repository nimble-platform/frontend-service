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
