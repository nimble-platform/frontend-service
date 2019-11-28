import {Injectable} from "@angular/core";
import { PublishMode } from "./model/publish/publish-mode";
import {ItemProperty} from "./model/publish/item-property";

@Injectable()
export class PublishService {
    publishMode: PublishMode = "create";
    publishingStarted: boolean = false;
    publishedProductNature: string = "Regular product"; // or Transportation service
    // associated products selected in the search process to be associated to the published product
    selectedProductsInSearch: any[] = null;
    // product for which the user is searching associated products.
    itemPropertyLinkedToOtherProducts: ItemProperty = null;

    propertyBlockCollapsedStates: Map<string, boolean> = new Map<string, boolean>();

    getCollapsedStates(): any {
        return this.propertyBlockCollapsedStates;
    }

    getCollapsedState(blockName: string): boolean {
        if(this.propertyBlockCollapsedStates.has(blockName)) {
            return this.propertyBlockCollapsedStates.get(blockName);
        } else {
            this.propertyBlockCollapsedStates.set(blockName, true);
            return true;
        }
    }

    resetData(): void {
        this.propertyBlockCollapsedStates = new Map<string, boolean>();
    }
}
