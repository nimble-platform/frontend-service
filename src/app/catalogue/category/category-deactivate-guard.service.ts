import {CanDeactivate} from "@angular/router";
import {Injectable} from "@angular/core";
import {CategorySearchComponent} from "./category-search.component";

@Injectable()
export class CategoryDeactivateGuardService implements CanDeactivate<CategorySearchComponent>{

    canDeactivate(component: CategorySearchComponent): boolean{
        if(!component.canDeactivate()){
            return false;
        }
        return true;
    }
}