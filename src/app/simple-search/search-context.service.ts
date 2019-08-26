import {Injectable} from "@angular/core";
import "rxjs/add/operator/toPromise";
import { ThreadEventMetadata } from "../catalogue/model/publish/thread-event-metadata";
import {ActivityVariableParser} from '../bpe/bp-view/activity-variable-parser';

@Injectable()
export class SearchContextService {
	private targetPartyRole:string;
	private associatedProcessType:string;
	private associatedProcessMetadata:ThreadEventMetadata;
	// For transport-related process instance groups, we need to know the preceding order id
    // since we need order details to create a valid transport execution plan or transport negotiation
	private precedingOrderId: string;

	public clearSearchContext():void {
		this.targetPartyRole = null;
		this.associatedProcessType = null;
		this.associatedProcessMetadata = null;
		this.precedingOrderId = null;
	}

	public setSearchContext(targetPartyRole:string, associatedProcessType:string,associatedProcessMetadata:ThreadEventMetadata):void{
	    this.targetPartyRole = targetPartyRole;
	    this.associatedProcessType = associatedProcessType;
	    this.associatedProcessMetadata = associatedProcessMetadata;
	    this.precedingOrderId = ActivityVariableParser.getPrecedingDocumentId(associatedProcessMetadata.activityVariables);
    }

    public getAssociatedProcessType():string{
	    return this.associatedProcessType;
    }

    public getAssociatedProcessMetadata():ThreadEventMetadata{
	    return this.associatedProcessMetadata;
    }

    public getPrecedingOrderId():string{
	    return this.precedingOrderId;
    }
}