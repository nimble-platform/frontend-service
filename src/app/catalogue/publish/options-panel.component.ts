import {Component, Input, OnInit} from '@angular/core';
import {Text} from '../model/publish/text';
import {ItemProperty} from '../model/publish/item-property';
import {selectNameFromLabelObject, selectPreferredValue} from '../../common/utils';
import {LogisticPublishingService} from './logistic-publishing.service';

@Component({
    selector: "options-panel",
    templateUrl: "./options-panel.component.html",
    styleUrls: ["./options-panel.component.css"]
})
export class OptionsPanelComponent implements OnInit{

    constructor(public logisticPublishingService:LogisticPublishingService) {
    }

    // inputs
    @Input() itemProperty:ItemProperty;
    @Input() checkboxOther = true;
    @Input() selectedOptionsWithExtraColumn = true;
    // variables
    options = [];

    option:string = null;

    isOtherOptionEnabled = false;
    title:string = null;

    ngOnInit(){

        if(this.itemProperty){
            this.logisticPublishingService.getCachedProperty(this.itemProperty.uri).then(indexedProperty => {
                // set the title
                this.title = selectPreferredValue(this.itemProperty.name);

                // retrieve options
                this.logisticPublishingService.getCachedPropertyCodeList(indexedProperty.codeListUri).then(codeListResult => {
                    for(let result of codeListResult.result){
                        let label = selectNameFromLabelObject(result.label);
                        this.options.push(new Text(label));
                    }
                });
            });
        }
    }

    onOptionAdded() {
        if(this.option){
            this.itemProperty.value.push(new Text(this.option));
        }
    }

    onOptionRemoved(value:Text) {
        this.itemProperty.value.splice(this.itemProperty.value.indexOf(value), 1);
    }

    onCheckboxChanged(checked,option){
        if(checked)
            this.itemProperty.value.push(option);
        else
            for(let selectedOption of this.itemProperty.value){
                if(selectedOption.value == option.value){
                    this.itemProperty.value.splice(this.itemProperty.value.indexOf(selectedOption),1);
                    break;
                }
            }
    }

    isDefaultOption(option:Text){
        for(let text of this.options){
            if(text.value == option.value){
                return true;
            }
        }
        return false;
    }

    isSelected(option:Text){
        for(let text of this.itemProperty.value){
            if(text.value == option.value){
                return true;
            }
        }
        return false;
    }
}
