import {Injectable} from "@angular/core";
import "rxjs/add/operator/toPromise";
import { ProcessMetatada } from "../bpe/bp-view/temp-process-metadata";

@Injectable()
export class SearchContextService {
	public targetPartyRole:string;
	public associatedProcessType:string;
	public associatedProcessMetadata:ProcessMetatada;

	public clearSearchContext():void {
		this.targetPartyRole = null;
		this.associatedProcessType = null;
		this.associatedProcessMetadata = null;
	}
}