import {Injectable} from "@angular/core";
import "rxjs/add/operator/toPromise";
import { ThreadEventMetadata } from "../catalogue/model/publish/thread-event-metadata";

@Injectable()
export class SearchContextService {
	private targetPartyRole:string;
	private associatedProcessType:string;
	private associatedProcessMetadata:ThreadEventMetadata;
	// For transport-related process instance groups, we need to know the preceding group id
    // since we need order details to create a valid transport execution plan or transport negotiation
	private precedingGroupId: string;

	public clearSearchContext():void {
		this.targetPartyRole = null;
		this.associatedProcessType = null;
		this.associatedProcessMetadata = null;
		this.precedingGroupId = null;
	}

	public setSearchContext(targetPartyRole:string, associatedProcessType:string,associatedProcessMetadata:ThreadEventMetadata,precedingGroupId:string):void{
	    this.targetPartyRole = targetPartyRole;
	    this.associatedProcessType = associatedProcessType;
	    this.associatedProcessMetadata = associatedProcessMetadata;
	    this.precedingGroupId = precedingGroupId;
    }

    public getAssociatedProcessType():string{
	    return this.associatedProcessType;
    }

    public getAssociatedProcessMetadata():ThreadEventMetadata{
	    return this.associatedProcessMetadata;
    }

    public getPrecedingGroupId():string{
	    return this.precedingGroupId;
    }
}