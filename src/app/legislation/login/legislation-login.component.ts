/*
 * Copyright 2020
 * AIDIMME - Technological Institute of Metalworking, Furniture, Wood, Packaging and Related sectors; Valencia; Spain
   In collaboration with
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import * as Globals from '../../globals';
import { TranslateService } from '@ngx-translate/core';
import { AppComponent } from '../../app.component';
import { CookieService } from 'ng2-cookies';

@Component({
    selector: 'legislation-login',
    templateUrl: './legislation-login.component.html',
    styleUrls: ['./legislation-login.component.css']
})
export class LegislationLoginComponent implements OnInit {

    alerts: any[] = [];
    alert_msg: string = "";

    constructor(
        private http: HttpClient,
        private router: Router,
        private translate: TranslateService,
        private appComponent: AppComponent,
        private cookieService: CookieService
    ) {
    }

    ngOnInit() {
        if (this.cookieService.get("bearer_token")) {
            const token = 'Bearer ' + this.cookieService.get("bearer_token");
            this.validateToken(token);
        }
        else {
            this.alert_msg = "Invalid email or password";
            this.appComponent.translate.get(this.alert_msg).subscribe((res: string) => {
                this.alert_msg = res;
                this.alerts.push({
                    type: 'danger',
                    message: this.alert_msg,
                });
            });
        }
    }

    validateToken(token: any) {
        var url = Globals.legislation_endpoint + "/rest/user/get/" + 0;

        const params = new HttpParams()
            .set('aToken', token)
            .set('authMode', Globals.config.legislationSettings.authMode);

        this.appComponent.loading = true;
        this.http.get(url, { params }).subscribe(
            (res: any[]) => {
                this.alert_msg = "Login Successful";
                this.appComponent.translate.get(this.alert_msg).subscribe((res: string) => {
                    this.alert_msg = res;
                    this.alerts.push({
                        type: 'success',
                        message: this.alert_msg,
                    });
                });
                this.appComponent.loading = false;
                this.router.navigate(['/legislation/search/']);
            },
            err => {
                this.alert_msg = err.error.description;
                this.alerts.push({
                    type: 'danger',
                    message: this.alert_msg,
                });
                this.appComponent.loading = false;
            }
        );
    }

    closeAlert(alert) {
        this.alerts.splice(this.alerts.indexOf(alert), 1);
    }

}
