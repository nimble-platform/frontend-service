/*
 * Copyright 2020
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
   In collaboration with
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
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

import {Component, Input, OnInit} from '@angular/core';
import {UserService} from '../user.service';
import {CookieService} from 'ng2-cookies';
import {CallStatus} from '../../common/call-status';
import {CompanySettings} from '../model/company-settings';
import {ActivatedRoute, Router} from '@angular/router';
import {AppComponent} from '../../app.component';
import {TranslateService} from '@ngx-translate/core';
import {BPEService} from '../../bpe/bpe.service';
import {copy} from '../../common/utils';


@Component({
    selector: 'company-payment-settings',
    templateUrl: './company-payment-settings.component.html',
    styleUrls: ['./company-payment-settings.component.css']
})
export class CompanyPaymentSettingsComponent implements OnInit {

    @Input() companySettings: CompanySettings;
    // login link for stripe account
    stripeLoginLink: string = null;
    // call status
    initCallStatus: CallStatus = new CallStatus();
    connectStripeCallStatus: CallStatus = new CallStatus();
    deleteAccountCallStatus: CallStatus = new CallStatus();


    constructor(private cookieService: CookieService,
                private userService: UserService,
                public route: ActivatedRoute,
                public router: Router,
                public bpeService: BPEService,
                public translateService: TranslateService,
                public appComponent: AppComponent) {

    }

    ngOnInit() {
        if (this.companySettings.tradeDetails.stripeAccountId) {
            // get account login link
            this.initCallStatus.submit();
            this.userService.getAccountLoginLink(this.companySettings.tradeDetails.stripeAccountId).then(response => {
                if (response) {
                    // set stripe login link
                    this.stripeLoginLink = response;
                    this.initCallStatus.callback(this.translateService.instant('Retrieved account login link'), true);
                } else {
                    // the company has an invalid stripe account id, therefore
                    // delete this account id from the company settings
                    let companySettings = copy(this.companySettings);
                    companySettings.tradeDetails.stripeAccountId = null;
                    this.userService.putSettingsForParty(companySettings, this.companySettings.companyID).then(() => {
                        // reset company account id
                        this.companySettings.tradeDetails.stripeAccountId = null;
                        // reset stripe login link
                        this.stripeLoginLink = null;
                        this.initCallStatus.callback(null, true);
                    }).catch(error => {
                        this.initCallStatus.error(this.translateService.instant('Failed to initialize payment settings'));
                    });
                }
            }).catch(() => {
                this.initCallStatus.error('Failed to initialize payment settings')
            })
        }
    }

    createAccount() {
        this.connectStripeCallStatus.submit();
        this.userService.connectStripe(this.companySettings.tradeDetails.stripeAccountId, this.companySettings.companyID).then(accountLink => {
            // navigate user to the account link so that s/he can register his/her company to Stripe
            window.location.href = accountLink.url;
            this.connectStripeCallStatus.callback(this.translateService.instant('Retrieved Stripe connect link successfully'))
        }).catch(error => {
            this.connectStripeCallStatus.error(this.translateService.instant('Failed to retrieve Stripe connect link'), error)
        })
    }

    navigateLoginLink() {
        window.location.href = this.stripeLoginLink;
    }

    deleteAccount() {
        this.deleteAccountCallStatus.submit();
        this.userService.deleteAccount(this.companySettings.tradeDetails.stripeAccountId).then(response => {
            if (response) {
                this.deleteAccountCallStatus.callback(this.translateService.instant('Deleted Stripe account successfully'));
                // reset company stripe account id
                this.companySettings.tradeDetails.stripeAccountId = null;
                // reset stripe login link
                this.stripeLoginLink = null;
            } else {
                this.deleteAccountCallStatus.error(this.translateService.instant('Failed to delete Stripe account'));
            }
        }).catch(() => {
            this.deleteAccountCallStatus.error(this.translateService.instant('Failed to delete Stripe account'));
        })
    }
}
