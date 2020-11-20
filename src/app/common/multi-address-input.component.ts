/*
 * Copyright 2020
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
   In collaboration with
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

import { Component, Input, OnInit } from '@angular/core';
import { Address } from '../catalogue/model/publish/address';
import { addressToString } from '../user-mgmt/utils';
import { DeliveryTerms } from '../user-mgmt/model/delivery-terms';
import { UBLModelUtils } from '../catalogue/model/ubl-model-utils';
import { Option } from './options-input.component';
import { EmptyFormBase } from './validation/empty-form-base';

@Component({
    selector: 'multi-address-input',
    templateUrl: './multi-address-input.component.html'
})

export class MultiAddressInputComponent extends EmptyFormBase implements OnInit {

    @Input() address: Address;
    @Input() disabled: boolean;
    @Input() deliveryTerms: DeliveryTerms[];
    @Input() required:boolean = true;

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
