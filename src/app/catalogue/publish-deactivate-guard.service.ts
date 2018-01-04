import {CanDeactivate} from "@angular/router";
import {Injectable} from "@angular/core";
import {ProductPublishComponent} from "./product-publish.component";

@Injectable()
export class PublishDeactivateGuardService implements CanDeactivate<ProductPublishComponent>{

    canDeactivate(component: ProductPublishComponent): boolean{
        if(!component.canDeactivate()){
            return false;
        }
        return true;
    }
}