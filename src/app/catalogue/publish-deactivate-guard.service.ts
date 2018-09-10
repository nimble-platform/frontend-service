import {CanDeactivate} from "@angular/router";
import {Injectable} from "@angular/core";
import {ProductPublishComponent} from "./publish/product-publish.component";

@Injectable()
export class PublishDeactivateGuardService implements CanDeactivate<ProductPublishComponent> {

    canDeactivate(component: ProductPublishComponent): boolean {
        return component.canDeactivate();
    }
}