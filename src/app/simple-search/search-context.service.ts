import {Injectable} from "@angular/core";
import "rxjs/add/operator/toPromise";

@Injectable()
export class SearchContextService {
	public targetPartyRole:string;
	public associatedProcessType:string;
	public associatedProcessMetadata:string;

	public clearSearchContext():void {
		this.targetPartyRole = null;
		this.associatedProcessType = null;
		this.associatedProcessMetadata = null;
	}
}