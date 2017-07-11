import {Component, Input} from '@angular/core';
import * as myGlobals from '../globals';

@Component({
    selector: 'negotiation-params',
    templateUrl: './negotiation-main.component.html'
})

export class NegotationMainComponent {
    @Input() productResponse: any;
    negotiatables_config = myGlobals.negotiatables;
    amount: number = 0;
    negotiatables = [];

    ngOnInit(): void {
        console.log("response: ");
        console.log(this.productResponse);
        for (let entry in this.productResponse) {
            if (this.isNegotiable(entry)) {
                this.negotiatables.push({
                    "key": entry,
                    "value": this.productResponse[entry]
                });
            }
        }
        this.negotiatables.sort(function (a: any, b: any) {
            var a_comp = a.key;
            var b_comp = b.key;
            return a_comp.localeCompare(b_comp);
        });
    }

    private sendTerms(): void {

    }

    private isNegotiable(property: string): boolean {
        var negotiatable = false;
        for (let field of this.negotiatables_config) {
            if (property.includes(field)) {
                negotiatable = true;
            }
        }
        return negotiatable;
    }
}