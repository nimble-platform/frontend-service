import {Injectable} from '@angular/core';
import {CanActivate, Router} from '@angular/router';
import {Observable} from 'rxjs';
import { of } from 'rxjs';
import * as myGlobals from '../globals';

@Injectable({providedIn: 'root'})
export class HomepageActivateService implements CanActivate {
    config = myGlobals.config;

    constructor(private router: Router) {
    }

    canActivate(): Observable<boolean> {
        if (!this.config.showHomepage) {
            this.router.navigate(['/user-mgmt/login']);
            return of(false);
        } else {
            return of(true);
        }
    }
}
