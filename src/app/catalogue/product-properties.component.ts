/**
 * Created by suat on 17-May-17.
 */

import {Component, Input} from "@angular/core";
import {Category} from "./model/category/category";
import {ItemProperty} from "./model/publish/item-property";
import {CatalogueLine} from "./model/publish/catalogue-line";
import {PublishService} from "./publish-and-aip.service";
import {PropertyBlockPipe} from "./property-block-pipe";

@Component({
    selector: 'product-properties',
    providers: [PropertyBlockPipe],
    templateUrl: './product-properties.component.html'
})

export class ProductPropertiesComponent {
    readonly PROPERTY_BLOCK_FIELD_NAME: string = "name";
    readonly PROPERTY_BLOCK_FIELD_ISCOLLAPSED = "isCollapsed";
    readonly PROPERTY_BLOCK_FIELD_PROPERTIES = "properties";

    @Input() catalogueLine: CatalogueLine;
    @Input() selectedCategories: Category[];

    // keeping the collapsed state of property blocks. it is actually a reference to the actual kept in publish service
    propertyBlockCollapsedStates: Map<string, boolean> = new Map<string, boolean>();
    // list keeping the properties in order not to render the same property more than once
    renderedPropertyIds: Array<string> = [];

    constructor(private publishService: PublishService) {
        this.propertyBlockCollapsedStates = this.publishService.getCollapsedStates();
    }

    /**
     * Extracts the custom properties from the addition item property arrays
     */
    retrieveCustomProperties(aipArr:ItemProperty[]):ItemProperty[] {
        let customProps:ItemProperty[] = []
        for(let property of aipArr) {
            if(property.itemClassificationCode.listID == "Custom") {
                customProps.push(property);
                this.renderedPropertyIds.push(property.id);
            }
        }
        return customProps;
    }

    /**
     * Changes the collapsed state of the property block with the given name
     */
    toggleCollapsed(blockName:string):void {
        this.propertyBlockCollapsedStates.set(blockName, !this.propertyBlockCollapsedStates.get(blockName));
    }

    /**
     * Closes the unit detail popup
     */
    closePropertyDetailsPopup() {
        let modal = document.getElementById('myModal');
        modal.style.display = "none";
    }

    trackByIndex(index: any, item: any) {
        return index;
    }
}
