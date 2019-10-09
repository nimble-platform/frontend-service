import {ActivatedRouteSnapshot, CanDeactivate, RouterStateSnapshot} from '@angular/router';
import {Injectable} from '@angular/core';
import {SimpleSearchComponent} from './simple-search.component';

@Injectable()
export class SearchNavigationGuardService implements CanDeactivate<SimpleSearchComponent> {

    canDeactivate(component: SimpleSearchComponent,
                  currentRoute: ActivatedRouteSnapshot,
                  currentState: RouterStateSnapshot,
                  nextState: RouterStateSnapshot): boolean {


        if (!component.canDeactivate(nextState)) {
            return false;
        }
        return true;
    }
}
