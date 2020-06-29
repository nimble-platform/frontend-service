/*
 * Copyright 2020
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
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

import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';
import 'rxjs/add/operator/toPromise';
import { CookieService } from 'ng2-cookies';
import {BPDataService} from './bp-data-service';
import {BPEService} from '../bpe.service';
import {CatalogueService} from '../../catalogue/catalogue.service';
import {Clause} from '../../catalogue/model/publish/clause';
import {copy} from '../../common/utils';
import {CompanySettings} from '../../user-mgmt/model/company-settings';
import {FEDERATIONID} from '../../catalogue/model/constants';

@Injectable()
export class ContractService {

    constructor(private http: Http,
                private bpDataService: BPDataService,
                private bpeService: BPEService,
                private catalogueService: CatalogueService,
                private cookieService: CookieService) { }

    getDefaultTermsAndConditions(catalogueUuids:string[], incoterms:string[], buyerPartyId:string, buyerFederationId:string, sellerSettings:CompanySettings[]): Promise<any> {

        return Promise.all([
            this.catalogueService.getContractForCatalogue(catalogueUuids),
            this.bpeService.getTermsAndConditions( // otherwise, use the default T&Cs
                this.cookieService.get('company_id'),
                FEDERATIONID(),
                sellerSettings[0].companyID,
                incoterms[0],
                sellerSettings[0].negotiationSettings.paymentTerms[0],
                sellerSettings[0].negotiationSettings.company.federationInstanceID
            )
        ]).then(([catalogueContractMap, defaultTermsAndConditions]) => {
            let termsAndConditions:any = [];

            let size = catalogueUuids.length;
            for(let i = 0; i < size; i++){
                let contractForCatalogue = catalogueContractMap[catalogueUuids[i]];
                // use the catalogue terms
                if(contractForCatalogue && contractForCatalogue.length > 0){
                    termsAndConditions.push(copy(contractForCatalogue));
                }
                // use either the company terms or default ones
                else{
                    let sellerNegotiationSettings = sellerSettings[i].negotiationSettings;
                    if(sellerNegotiationSettings.company.salesTerms && sellerNegotiationSettings.company.salesTerms.termOrCondition.length > 0){
                        termsAndConditions.push(copy(sellerNegotiationSettings.company.salesTerms.termOrCondition))
                    } else{
                        // adapt the terms and conditions for the other products by updating the terms including incoterm
                        let copyTCs: Clause[] = copy(defaultTermsAndConditions);
                        if(i != 0){
                            for (let clause of copyTCs) {
                                for (let tradingTerm of clause.tradingTerms) {
                                    if (tradingTerm.id.includes('incoterms_id')) {
                                        tradingTerm.value.valueCode[0].value = incoterms[i];
                                    } else if (tradingTerm.id.includes('payment_id')) {
                                        tradingTerm.value.valueCode[0].value = sellerNegotiationSettings.paymentTerms[0];
                                    } else if (tradingTerm.id.includes("$seller_id")){
                                        tradingTerm.value.value[0].value = sellerNegotiationSettings.company.partyName[0].name.value;
                                    } else if (tradingTerm.id.includes("$seller_website")){
                                        tradingTerm.value.value[0].value = sellerNegotiationSettings.company.websiteURI;
                                    } else if (tradingTerm.id.includes("$seller_tel") && sellerNegotiationSettings.company.person.length > 0){
                                        tradingTerm.value.value[0].value = sellerNegotiationSettings.company.person[0].contact.telephone;
                                    }
                                }
                            }
                        }
                        termsAndConditions.push(copyTCs);
                    }
                }
            }
            return termsAndConditions;
        });
    }

}
