/*
 * Copyright 2020
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
   In collaboration with
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
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
import { Text } from '../model/publish/text';
import { ItemProperty } from '../model/publish/item-property';
import { selectNameFromLabelObject, selectPreferredValue } from '../../common/utils';
import { PublishingPropertyService } from './publishing-property.service';
import { TranslateService } from '@ngx-translate/core';
import {NonPublicInformation} from '../model/publish/non-public-information';
import {CatalogueLine} from '../model/publish/catalogue-line';
import {config} from '../../globals';

/**
 * This component is used to display options for the properties of Logistics Services
 * */
@Component({
    selector: "options-panel",
    templateUrl: "./options-panel.component.html",
    styleUrls: ["./options-panel.component.css"]
})
export class OptionsPanelComponent implements OnInit {

    constructor(public publishingPropertyService: PublishingPropertyService,
        private translate: TranslateService) {
    }

    // inputs
    @Input() itemProperty: ItemProperty;
    @Input() checkboxOther = true;
    @Input() selectedOptionsWithExtraColumn = true;
    @Input() catalogueLine:CatalogueLine = null;
    // variables
    options = [];

    option: string = null;
    nonPublicInformationFunctionalityEnabled = config.nonPublicInformationFunctionalityEnabled;

    isOtherOptionEnabled = false;
    title: string = null;

    ngOnInit() {

        if (this.itemProperty) {
            this.publishingPropertyService.getCachedProperty(this.itemProperty.uri).then(indexedProperty => {
                // set the title
                this.title = selectPreferredValue(this.itemProperty.name);

                // retrieve options
                this.publishingPropertyService.getCachedPropertyCodeList(indexedProperty.codeListId).then(codeListResult => {
                    for (let result of codeListResult.result) {
                        let label = selectNameFromLabelObject(result.label);
                        this.options.push(new Text(label));
                    }
                });
            });
        }
    }

    onOptionAdded() {
        if (this.option) {
            this.itemProperty.value.push(new Text(this.option));
            this.option = null;
        }
    }

    onOptionRemoved(value: Text) {
        this.itemProperty.value.splice(this.itemProperty.value.indexOf(value), 1);
    }

    onCheckboxChanged(checked, option) {
        if (checked)
            this.itemProperty.value.push(option);
        else
            for (let selectedOption of this.itemProperty.value) {
                if (selectedOption.value == option.value) {
                    this.itemProperty.value.splice(this.itemProperty.value.indexOf(selectedOption), 1);
                    break;
                }
            }
    }

    isDefaultOption(option: Text) {
        for (let text of this.options) {
            if (text.value == option.value) {
                return true;
            }
        }
        return false;
    }

    isSelected(option: Text) {
        for (let text of this.itemProperty.value) {
            if (text.value == option.value) {
                return true;
            }
        }
        return false;
    }

    onNonPublicClicked(checked){
        if(checked){
            let nonPublicInformation:NonPublicInformation = new NonPublicInformation();
            nonPublicInformation.id = this.itemProperty.id;
            this.catalogueLine.nonPublicInformation.push(nonPublicInformation);
        } else{
            const index = this.catalogueLine.nonPublicInformation.findIndex(value => value.id === this.itemProperty.id);
            this.catalogueLine.nonPublicInformation.splice(index,1);
        }
    }

    isNonPublicChecked(){
        return this.catalogueLine.nonPublicInformation.findIndex(value => value.id === this.itemProperty.id) !== -1;
    }
}
