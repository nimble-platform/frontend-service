import {ActivatedRouteSnapshot, CanDeactivate, RouterStateSnapshot} from "@angular/router";
import {Injectable} from "@angular/core";
import {CategorySearchComponent} from "./category-search.component";

@Injectable()
export class CategoryDeactivateGuardService implements CanDeactivate<CategorySearchComponent>{

    canDeactivate(component: CategorySearchComponent,
                  currentRoute: ActivatedRouteSnapshot,
                  currentState: RouterStateSnapshot,
                  nextState: RouterStateSnapshot): boolean{
        if(!component.canDeactivate(nextState)){
            return false;
        }
        return true;
    }
}