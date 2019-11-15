import {Component, Input, OnInit} from '@angular/core';
import {Address} from '../catalogue/model/publish/address';
import {addressToString} from '../user-mgmt/utils';
import {DeliveryTerms} from '../user-mgmt/model/delivery-terms';
import {UBLModelUtils} from '../catalogue/model/ubl-model-utils';
import {Option} from './options-input.component';


@Component({
    selector: 'multi-address-input',
    templateUrl: './multi-address-input.component.html'
})

export class MultiAddressInputComponent {

    @Input() address: Address;
    @Input() disabled: boolean;
    @Input() deliveryTerms: DeliveryTerms[];

    selectedAddressValue = '';

    constructor() { }

    get selectedAddress(): string {
        return this.selectedAddressValue;
    }

    set selectedAddress(addressStr: string) {
        this.selectedAddressValue = addressStr;

        if (addressStr !== '') {
            const index = Number(addressStr);
            UBLModelUtils.mapUserMgmtAddressToUblAddress(this.address, this.deliveryTerms[index].deliveryAddress);
        }
    }

    get addressOptions(): Option[] {
        const deliveryTerms = this.deliveryTerms;
        let ret = [];
        if (deliveryTerms.length === 0 || !deliveryTerms[0].deliveryAddress || !deliveryTerms[0].deliveryAddress.streetName) {
            ret = [
                { name: 'No', value: '' }
            ];
        } else {
            ret = [
                { name: 'No', value: '' }
            ].concat(deliveryTerms.map((term, i) => {
                return { name: addressToString(term.deliveryAddress), value: String(i) };
            }));
        }
        return ret;
    }

    isDisabled(): boolean {
        // additional check for the disabled status
        return this.disabled || this.selectedAddressValue !== '';
    }
}
