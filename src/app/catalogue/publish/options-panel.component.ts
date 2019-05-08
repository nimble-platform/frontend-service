import {Component, Input, OnInit} from '@angular/core';
import {Text} from '../model/publish/text';
import {Item} from '../model/publish/item';
import {BinaryObject} from '../model/publish/binary-object';
import {DocumentReference} from '../model/publish/document-reference';
import {Attachment} from '../model/publish/attachment';
import {SimpleSearchService} from '../../simple-search/simple-search.service';
import {ItemProperty} from '../model/publish/item-property';
import {selectNameFromLabelObject, selectPreferredValue} from '../../common/utils';

@Component({
    selector: "options-panel",
    templateUrl: "./options-panel.component.html",
    styleUrls: ["./options-panel.component.css"]
})
export class OptionsPanelComponent implements OnInit{

    constructor(public searchService:SimpleSearchService) {
    }

    // inputs
    @Input() selectedTab;
    @Input() itemProperty:ItemProperty;
    @Input() divStyle;
    @Input() checkboxOther = true;
    @Input() item:Item;
    @Input() selectedOptionsWithExtraColumn = true;
    // variables
    options = [];

    option:string = null;

    files:BinaryObject[];

    isOtherOptionEnabled = false;
    title:string = null;

    ngOnInit(){

        if(this.item && this.item.itemSpecificationDocumentReference){
            this.files = this.item.itemSpecificationDocumentReference.map(doc => doc.attachment.embeddedDocumentBinaryObject);
        }
        if(this.itemProperty){
            this.searchService.getProperty(this.itemProperty.uri).then(indexedProperty => {
                // set the title
                this.title = selectPreferredValue(this.itemProperty.name);

                // retrieve options
                this.searchService.getPropertyCodeList(indexedProperty.codeListUri).then(codeListResult => {
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
        this.itemProperty.value.slice(this.itemProperty.value.indexOf(value), 1);
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

    // methods for file selection
    onSelectFile(binaryObject: BinaryObject){
        const document: DocumentReference = new DocumentReference();
        const attachment: Attachment = new Attachment();
        attachment.embeddedDocumentBinaryObject = binaryObject;
        document.attachment = attachment;
        this.item.itemSpecificationDocumentReference.push(document);
    }

    onUnSelectFile(binaryObject: BinaryObject){
        const index = this.item.itemSpecificationDocumentReference.findIndex(doc => doc.attachment.embeddedDocumentBinaryObject === binaryObject);
        if(index >= 0) {
            this.item.itemSpecificationDocumentReference.splice(index, 1);
        }
    }
}
