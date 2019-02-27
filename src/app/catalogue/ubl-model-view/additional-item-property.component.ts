/**
 * Created by suat on 18-May-17.
 */
import {Component, Input, OnDestroy, OnInit} from "@angular/core";
import {ItemProperty} from "../model/publish/item-property";
import {CatalogueService} from "../catalogue.service";
import {Subscription} from "rxjs/Subscription";
import {BPDataService} from "../../bpe/bp-view/bp-data-service";
import {Property} from "../model/category/property";
import {FormGroup} from "@angular/forms";
import {createText, selectName, selectDescription, selectPreferredName, selectItemPropertyValuesAsString} from '../../common/utils';
import {Category} from '../model/category/category';
import {Item} from '../model/publish/item';

@Component({
    selector: 'additional-item-property',
    templateUrl: './additional-item-property.component.html'
})

export class AdditionalItemPropertyComponent implements OnInit, OnDestroy {

    @Input() additionalItemProperty: ItemProperty;
    @Input() propertyDetails: Property;
    /* presentation mode can take three values: view, edit, singlevalue
     view: all values for the item property are presented
     edit: all values are presented and they are editable
     singlevalue: only a single value can be chosen for the property. this mode is expected to be used when the
     item is used in business processes like negotiation */
    @Input() presentationMode: string;
    @Input() parentForm: FormGroup;

    editModeSubscription: Subscription;
    showPropertyDetails: boolean = false;
    customProperty: boolean = false;

    constructor(private catalogueService:CatalogueService,
                private bpDataService: BPDataService) {
    }

    openPropertyDetails(): void {
        this.showPropertyDetails = !this.showPropertyDetails;
    }

    selectName (ip: ItemProperty | Item) {
        return selectName(ip);
    }

    selectDescription (item:  Item) {
        return selectDescription(item);
    }

    selectItemPropertyValuesAsString (ip: ItemProperty) {
        return selectItemPropertyValuesAsString(ip, null);
    }

    addValueToProperty(aipName: string) {
        if (this.additionalItemProperty.valueQualifier == "STRING") {
            this.additionalItemProperty.value.push(createText(''));
        } else if (this.additionalItemProperty.valueQualifier == "NUMBER") {
            let newNumber: number;
            this.additionalItemProperty.valueDecimal.push(newNumber);
        } else if (this.additionalItemProperty.valueQualifier == "BINARY") {
            // not applicable
        }
    }

    selectPreferredName(cp: Category | Property) {
        return selectPreferredName(cp);
    }

    ngOnInit(): void {
        if (this.additionalItemProperty.itemClassificationCode.listID == "Custom") {
            this.customProperty = true;
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

        } else if (this.additionalItemProperty.valueQualifier == "NUMBER") {
            this.additionalItemProperty.valueDecimal.splice(index, 1);
            dataSource = this.additionalItemProperty.valueDecimal;
        }

        // if the property no longer has a value, delete it
        if (dataSource.length == 0) {
            this.deleteCustomProperty(selectName(this.additionalItemProperty));
        }
    }

    /**
     * deletes the custom property with the given name
     */
    deleteCustomProperty(inputVal: string) {
        let draftCatalogueLine = this.catalogueService.draftCatalogueLine;
        let indexCatalogue = draftCatalogueLine.goodsItem.item.additionalItemProperty.findIndex(p => selectName(p) == inputVal);
        draftCatalogueLine.goodsItem.item.additionalItemProperty.splice(indexCatalogue, 1);
        draftCatalogueLine.goodsItem.item.additionalItemProperty = [].concat(draftCatalogueLine.goodsItem.item.additionalItemProperty);
    }

    updateNegotiationItemPropertyData(event:any) {
        let selectedIndex = event.target.selectedIndex;

        if(this.additionalItemProperty.valueQualifier == 'STRING') {
            let prevValue = this.additionalItemProperty.value[0];
            this.additionalItemProperty.value[0] = createText(event.target.value);
            this.additionalItemProperty.value[selectedIndex] = prevValue;
        } else if(this.additionalItemProperty.valueQualifier == 'NUMBER') {
            let prevValue = this.additionalItemProperty.valueDecimal[0];
            this.additionalItemProperty.valueDecimal[0] = event.target.value;
            this.additionalItemProperty.valueDecimal[selectedIndex] = prevValue;
        } else if(this.additionalItemProperty.valueQualifier == 'BOOLEAN') {
            let prevValue = this.additionalItemProperty.value[0];
            this.additionalItemProperty.value[0] = createText(event.target.value);
            this.additionalItemProperty.value[selectedIndex] = prevValue;
        } else if(this.additionalItemProperty.valueQualifier == 'QUANTITY') {
            let prevValue = this.additionalItemProperty.valueQuantity[0];
            this.additionalItemProperty.valueQuantity[0] = event.target.value;
            this.additionalItemProperty.valueQuantity[selectedIndex] = prevValue;
        }

        this.bpDataService.updateItemProperty(this.additionalItemProperty);
    }

    onSelectChange(event:any){
        let firstValue = this.additionalItemProperty.valueQuantity[0];
        this.additionalItemProperty.valueQuantity[0] = this.additionalItemProperty.valueQuantity[event.target.selectedIndex];
        this.additionalItemProperty.valueQuantity[event.target.selectedIndex] = firstValue;
        let index = this.bpDataService.modifiedCatalogueLines[0].goodsItem.item.additionalItemProperty.findIndex(item => selectName(item) == selectName(this.additionalItemProperty));
        this.bpDataService.modifiedCatalogueLines[0].goodsItem.item.additionalItemProperty[index].valueQuantity[0] = this.additionalItemProperty.valueQuantity[0];
    }

    trackByIndex(index: any, item: any) {
        return index;
    }
}
