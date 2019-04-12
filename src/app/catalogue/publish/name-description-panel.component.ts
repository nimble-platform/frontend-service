import {Component, Input, OnInit} from '@angular/core';
import {COUNTRY_NAMES} from '../../common/utils';
import {Text} from '../model/publish/text';
import {DEFAULT_LANGUAGE} from '../model/constants';

@Component({
    selector: "name-description-panel",
    templateUrl: "./name-description-panel.component.html"
})
export class NameDescriptionPanelComponent implements OnInit{

    constructor() {
    }

    @Input() item;

    ngOnInit(){

    }

    addItemNameDescription() {
        let newItemName: Text = new Text("",DEFAULT_LANGUAGE());
        let newItemDescription: Text = new Text("",DEFAULT_LANGUAGE());
        this.item.name.push(newItemName);
        this.item.description.push(newItemDescription);
    }

    deleteItemNameDescription(index){
        this.item.name.splice(index, 1);
        this.item.description.splice(index, 1);
    }

}
