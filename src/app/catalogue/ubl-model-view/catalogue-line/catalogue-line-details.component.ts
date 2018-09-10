import {Component, Input} from "@angular/core";
import {CatalogueLine} from "../../model/publish/catalogue-line";
import {PropertyBlockPipe} from "../../property-block-pipe";
import {PublishService} from "../../publish-and-aip.service";
import {FormGroup} from "@angular/forms";

@Component({
    selector: 'catalogue-line-details',
    providers: [PropertyBlockPipe],
    templateUrl: './catalogue-line-details.component.html',
})

// Component that displays category and custom properties inside the "product details" tab in CatalogueLin

/**
 * Anthony 11.06.2018: this component is deprecated and will be replaced by the product details components/page.
 */
export class CatalogueLineDetailsComponent{

    PROPERTY_BLOCK_FIELD_NAME: string = "name";
    PROPERTY_BLOCK_FIELD_PROPERTIES = "properties";
    PROPERTY_BLOCK_FIELD_PROPERTY_DETAILS = "propertyDetails";

    @Input() presentationMode: string
    @Input() catalogueLine: CatalogueLine;
    @Input() parentForm: FormGroup;

    // keeping the collapsed state of property blocks. it is actually a reference to the actual kept in publish service
    propertyBlockCollapsedStates: Map<string, boolean> = new Map<string, boolean>();

    constructor(private publishService: PublishService) {
        this.propertyBlockCollapsedStates = this.publishService.getCollapsedStates();
    }

    toggleCollapsed(blockName:string):void {
        this.propertyBlockCollapsedStates.set(blockName, !this.propertyBlockCollapsedStates.get(blockName));
    }

    trackByIndex(index: any, item: any) {
        return index;
    }
}
