import {Component, Input, ViewChild} from "@angular/core";
import {CatalogueLine} from "../../model/publish/catalogue-line";
import {FormGroup, NgForm} from "@angular/forms";
/**
 * Created by suat on 24-Oct-17.
 */

@Component({
    selector: 'catalogue-line-header',
    templateUrl: './catalogue-line-header.component.html'
})

export class CatalogueLineHeaderComponent {
    @ViewChild('catalogueLineHeaderForm') public catalogueLineHeaderForm: NgForm;
    @Input() catalogueLine: CatalogueLine;
    @Input() presentationMode: string;
    @Input() parentForm: FormGroup;

    PROPERTY_BLOCK_FIELD_NAME: string = "name";
    PROPERTY_BLOCK_FIELD_PROPERTIES = "properties";
    PROPERTY_BLOCK_FIELD_PROPERTY_DETAILS = "propertyDetails";
    propertyBlockCollapsedStates: Map<string, boolean> = new Map<string, boolean>();

    // after first three custom properties,check whether the rest is visible or not
    showOtherCustomProperties = false;

    toggleCollapsed(blockName:string):void {
        this.propertyBlockCollapsedStates.set(blockName, !this.propertyBlockCollapsedStates.get(blockName));
    }

    trackByIndex(index: any, item: any) {
        return index;
    }

}