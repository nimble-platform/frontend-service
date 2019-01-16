import {Injectable} from "@angular/core";
import "rxjs/add/operator/toPromise";
import { ThreadEventMetadata } from "../catalogue/model/publish/thread-event-metadata";

@Injectable()
export class SearchContextService {
	private targetPartyRole:string;
	private associatedProcessType:string;
	private associatedProcessMetadata:ThreadEventMetadata;

	public clearSearchContext():void {
		this.targetPartyRole = null;
		this.associatedProcessType = null;
		this.associatedProcessMetadata = null;
	}

	public setSearchContext(targetPartyRole:string, associatedProcessType:string,associatedProcessMetadata:ThreadEventMetadata):void{
	    this.targetPartyRole = targetPartyRole;
	    this.associatedProcessType = associatedProcessType;
	    this.associatedProcessMetadata = associatedProcessMetadata;
    }

    public getAssociatedProcessType():string{
	    return this.associatedProcessType;
    }

    public getAssociatedProcessMetadata():ThreadEventMetadata{
	    return this.associatedProcessMetadata;
    }
}