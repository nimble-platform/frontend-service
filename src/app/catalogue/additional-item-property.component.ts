/**
 * Created by suat on 18-May-17.
 */
import {Component, Input, OnDestroy, OnInit} from "@angular/core";
import {ItemProperty} from "./model/publish/item-property";
import {CatalogueService} from "./catalogue.service";
import {Subscription} from "rxjs/Subscription";
import {BPDataService} from "../bpe/bp-data-service";

@Component({
    selector: 'additional-item-property',
    templateUrl: './additional-item-property.component.html'
})

export class AdditionalItemPropertyComponent implements OnInit, OnDestroy {

    @Input() additionalItemProperty: ItemProperty;
    /* presentation mode can take three values: view, edit, singlevalue
     view: all values for the item property are presented
     edit: all values are presented and they are editable
     singlevalue: only a single value can be chosen for the property. this mode is expected to be used when the
     item is used in business processes like negotiation */
    @Input() presentationMode: string;

    editModeSubscription: Subscription;

    customProperty: boolean = false;
    propertyUnitDefined: boolean = false;

    constructor(private catalogueService:CatalogueService,
                private bpDataService: BPDataService) {
    }

    openPropertyDetails(): void {
        let modal = document.getElementById('myModal');

        let header = document.getElementById('header');
        header.innerText = this.additionalItemProperty.name;

        let prop_def = document.getElementById('prop_def');
        //TODO retrieve the property definition from the actual property objects
        //prop_def.innerText = this.additionalItemProperty.propertyDefinition;

        if (this.propertyUnitDefined == true) {
            let prop_unit = document.getElementById('prop_unit');
            prop_unit.innerText = this.additionalItemProperty.unit;

            let unit_label = document.getElementById('unit_label');
            unit_label.innerText = "Unit: ";
        }
        else {
            let prop_unit = document.getElementById('prop_unit');
            prop_unit.innerText = "";

            let unit_label = document.getElementById('unit_label');
            unit_label.innerText = "";
        }

        modal.style.display = "block";
    }

    addValueToProperty(aipName: string) {
        if (this.additionalItemProperty.valueQualifier == "STRING") {
            this.additionalItemProperty.value.push('');
        } else if (this.additionalItemProperty.valueQualifier == "REAL_MEASURE") {
            let newNumber: number;
            this.additionalItemProperty.valueDecimal.push(newNumber);
        } else if (this.additionalItemProperty.valueQualifier == "BINARY") {
            // not applicable
        }
    }

    ngOnInit(): void {
        if (this.additionalItemProperty.itemClassificationCode.listID == "Custom") {
            this.customProperty = true;
        }
        if (this.additionalItemProperty.unit && this.additionalItemProperty.unit.length > 0) {
            this.propertyUnitDefined = true;
        }

        this.editModeSubscription = this.catalogueService.editModeObs
            .subscribe(editMode => {
                if (editMode == true) {
                    //this.presentationMode = "edit";
                } else {
                    //this.presentationMode = "view";
                }
            });
    }

    ngOnDestroy(): void {
        this.editModeSubscription.unsubscribe();
    }

    //remove a value from displayed custom property
    removeCustomValue(index: number) {
        let dataSource: Array<any>;
        if (this.additionalItemProperty.valueQualifier == "STRING") {
            this.additionalItemProperty.value.splice(index, 1);
            dataSource = this.additionalItemProperty.value;

        } else if (this.additionalItemProperty.valueQualifier == "REAL_MEASURE") {
            this.additionalItemProperty.valueDecimal.splice(index, 1);
            dataSource = this.additionalItemProperty.valueDecimal;
        }

        // if the property no longer has a value, delete it
        if (dataSource.length == 0) {
            this.deleteCustomProperty(this.additionalItemProperty.name);
        }
    }

    /**
     * deletes the custom property with the given name
     */
    deleteCustomProperty(inputVal: string) {
        let draftCatalogueLine = this.catalogueService.draftCatalogueLine;
        let indexCatalogue = draftCatalogueLine.goodsItem.item.additionalItemProperty.findIndex(p => p.name == inputVal);
        draftCatalogueLine.goodsItem.item.additionalItemProperty.splice(indexCatalogue, 1);
        draftCatalogueLine.goodsItem.item.additionalItemProperty = [].concat(draftCatalogueLine.goodsItem.item.additionalItemProperty);
    }

    updateNegotiationItemPropertyData(event:any) {
        let selectedValue:any = event.target.value;
        this.bpDataService.updateItemProperty(selectedValue, this.additionalItemProperty);
    }

    private generateUUID(): string {
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    };

    trackByIndex(index: any, item: any) {
        return index;
    }
}
