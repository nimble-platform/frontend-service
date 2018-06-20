import {Injectable} from "@angular/core";
import "rxjs/add/operator/toPromise";
import { ThreadEventMetadata } from "../catalogue/model/publish/thread-event-metadata";

@Injectable()
export class SearchContextService {
	public targetPartyRole:string;
	public associatedProcessType:string;
	public associatedProcessMetadata:ThreadEventMetadata;

	public clearSearchContext():void {
		this.targetPartyRole = null;
		this.associatedProcessType = null;
		this.associatedProcessMetadata = null;
	}
}