import {Component, Input} from "@angular/core";
import {Contract} from "../../../catalogue/model/publish/contract";

@Component({
    selector: 'contract',
    templateUrl: './contract.component.html'
})
export class ContractComponent {
    @Input() contract: Contract = null;
}
