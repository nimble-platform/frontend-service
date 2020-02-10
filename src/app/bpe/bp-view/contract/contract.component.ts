import {Component, Input} from "@angular/core";
import {Contract} from "../../../catalogue/model/publish/contract";
import {TranslateService} from '@ngx-translate/core';

@Component({
    selector: 'contract',
    templateUrl: './contract.component.html',
    styleUrls: ["./contract.component.css"]
})
export class ContractComponent {
    @Input() contract: Contract = null;
    @Input() sellerFederationId:string = null;
    @Input() showQuotation: boolean = false;
    @Input() collapsable: boolean = true;
    // whether the item is deleted or not
    @Input() areCatalogueLinesDeleted:boolean[];
    @Input() selectedLineIndex:number;
    showClauses:boolean = false;

    constructor(private translate: TranslateService) {
    }
}
