import {Component, Input, OnInit} from '@angular/core';
import {Address} from '../catalogue/model/publish/address';
import {addressToString} from '../user-mgmt/utils';
import {DeliveryTerms} from '../user-mgmt/model/delivery-terms';
import {UBLModelUtils} from '../catalogue/model/ubl-model-utils';
import {Option} from './options-input.component';
import {EmptyFormBase} from './validation/empty-form-base';
import {AbstractControl, FormControl} from '@angular/forms';
import {addressValidator, ValidationService} from './validation/validators';
import {ChildFormBase} from './validation/child-form-base';

@Component({
    selector: 'multi-address-input',
    templateUrl: './multi-address-input.component.html'
})

export class MultiAddressInputComponent extends EmptyFormBase implements OnInit {

    @Input() address: Address;
    @Input() disabled: boolean;
    @Input() deliveryTerms: DeliveryTerms[];

    selectedAddressValue = '';

    constructor() {
        super();
    }

    ngOnInit(): void {
        // this.initViewFormAndAddToParentForm();
    }

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
        if (!this.deliveryTerms) {
            return [];
        }
        const deliveryTerms = this.deliveryTerms;
        let ret = [];
        if (deliveryTerms.length === 0 || !deliveryTerms[0].deliveryAddress || !deliveryTerms[0].deliveryAddress.streetName) {
            ret = [
                { name: '-', value: '' }
            ];
        } else {
            ret = [
                { name: '-', value: '' }
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
