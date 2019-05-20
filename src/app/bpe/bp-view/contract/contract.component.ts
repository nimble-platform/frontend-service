import {Component, Input} from "@angular/core";
import {Contract} from "../../../catalogue/model/publish/contract";

@Component({
    selector: 'contract',
    templateUrl: './contract.component.html',
    styleUrls: ["./contract.component.css"]
})
export class ContractComponent {
    @Input() contract: Contract = null;
    @Input() showQuotation: boolean = false;

    showClauses:boolean = false;
}
