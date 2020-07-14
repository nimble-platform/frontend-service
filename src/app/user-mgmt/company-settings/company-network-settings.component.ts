/*
 * Copyright 2020
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

import { Component, OnInit, Input } from "@angular/core";
import { CompanySettings } from "../model/company-settings";
import { CallStatus } from "../../common/call-status";
import { UserService } from "../user.service";
import { CookieService } from "ng2-cookies";
import { TranslateService } from '@ngx-translate/core';
import * as myGlobals from '../../globals';
import {NetworkCompanyListService} from '../network-company-list.service';
import {DEFAULT_LANGUAGE} from '../../catalogue/model/constants';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {copy} from '../../common/utils';
import {Network} from '../../catalogue/model/publish/network';
import {Text} from '../../catalogue/model/publish/text';
import {SimpleSearchService} from '../../simple-search/simple-search.service';

@Component({
    selector: "company-network-settings",
    templateUrl: "./company-network-settings.component.html",
    styleUrls: ["./company-network-settings.component.css"]
})
export class CompanyNetworkSettingsComponent implements OnInit {

    @Input() settings: CompanySettings;

    product_vendor_name = myGlobals.product_vendor_name;
    product_vendor_brand_name = myGlobals.product_vendor_brand_name;

    callStatus: CallStatus = new CallStatus();

    addSelectedCompanies:boolean = false;
    // party vat number - party name
    partyNameMap:Map<string,string> = null;
    getPartyNameCallStatus:CallStatus = new CallStatus();
    searchRef:boolean = false;
    // whether the network is collapsed or not
    showNetwork:boolean[] = [];

    networkGroups:Network[] = null;

    constructor(private translate: TranslateService,
                private cookieService: CookieService,
                public networkCompanyListService: NetworkCompanyListService,
                private userService: UserService,
                public simpleSearchService: SimpleSearchService,
                public route: ActivatedRoute,
                public router: Router) {

    }

    ngOnInit() {
        this.route.queryParams.subscribe((params: Params) => {
            // searchRef is true if the searchRef parameter is set
            this.searchRef = !!params['searchRef'];

            this.addSelectedCompanies = this.searchRef && this.networkCompanyListService.selectedNetworkIndex !== null;

            if(this.addSelectedCompanies){
                this.networkGroups = copy(this.networkCompanyListService.networks);
            } else if(this.settings.negotiationSettings.company.network && this.settings.negotiationSettings.company.network.length > 0){
                this.networkGroups = copy(this.settings.negotiationSettings.company.network);
            }

            this.setSelectedPartiesAndPopulatePartyNameMap();

            // populate showNetwork array with false
            if(this.networkGroups){
                this.showNetwork.fill(false,0,this.networkGroups.length);
                if(this.addSelectedCompanies){
                    this.showNetwork[this.networkCompanyListService.selectedNetworkIndex] = true;
                }
            }

        });
    }

    onAddNetworkGroup(){
        // the case where network is null
        if(this.networkGroups == null){
            this.networkGroups = [];
        }

        let network:Network = new Network();
        network.id = "Network ID";
        network.description.push(new Text(""));
        this.networkGroups.push(network);

        // update showNetwork array
        this.showNetwork.push(false);
        // rest call status to get rid of previous errors or success messages
        this.callStatus.reset();
    }

    onRemoveNetworkGroup(index:number) {
        // remove network
        this.networkGroups.splice(index, 1);
        // remove network from the showNetwork array
        this.showNetwork.splice(index,1);

    }

    trackByFn(index: any) {
        return index;
    }

    addNetworkDescription(indexOfNetwork) {
        this.networkGroups[indexOfNetwork].description.push(new Text("", DEFAULT_LANGUAGE()));
    }

    deleteNetworkDescription(indexOfNetwork, indexOfDescription) {
        this.networkGroups[indexOfNetwork].description.splice(indexOfDescription,1);
    }

    onSave() {
        this.callStatus.submit();
        // check uniqueness of network groups
        if (!this.checkUniquenessOfNetworkIds()) {
            this.callStatus.error(this.translate.instant("Each network should have unique id."));
            return;
        }
        // copy the negotiation settings
        let negotiationSettingsCopy = copy(this.settings.negotiationSettings);
        // set the terms and conditions
        negotiationSettingsCopy.company.network = this.networkGroups;
        this.userService
            .putCompanyNegotiationSettings(negotiationSettingsCopy, this.settings.companyID)
            .then(() => {
                // update company negotiation settings
                this.settings.negotiationSettings = copy(negotiationSettingsCopy);
                this.callStatus.callback(this.translate.instant("Saved your networks successfully"));
            })
            .catch(error => {
                this.callStatus.error("Error while saving company negotiation settings.", error);
            });
    }

    // each clause should have unique id
    // this method checks the uniqueness of clauses and returns true if each clause has unique id
    checkUniquenessOfNetworkIds(): boolean {
        // clause id list
        let networkIds = [];
        for (let network of this.networkGroups) {
            if (networkIds.indexOf(network.id) != -1) {
                return false;
            }
            networkIds.push(network.id);
        }
        return true;
    }

    setSelectedPartiesAndPopulatePartyNameMap(){
        // retrieve selected company vat numbers
        let selectedPartyVatNumbers: string[] = [];
        if(this.networkGroups){
            for (let network of this.networkGroups) {
                for (let vatNumber of network.vatNumber) {
                    if(selectedPartyVatNumbers.indexOf(vatNumber) == -1){
                        selectedPartyVatNumbers.push(vatNumber);
                    }
                }
            }
        }

        if(selectedPartyVatNumbers.length > 0){
            this.getPartyNameCallStatus.submit();
            this.simpleSearchService.getEFactoryCompanies(selectedPartyVatNumbers).then(response => {
                this.partyNameMap = new Map<string,string>();

                for (let party of response.result) {
                    this.partyNameMap.set(party.vatNumber,party.legalName);
                }

                this.getPartyNameCallStatus.callback("Retrieved party names",true);
            }).catch(error => {
                this.getPartyNameCallStatus.error(this.translate.instant("Failed to get party names"),error);
            })
        }
    }

    isPartyNamesLoading(): boolean {
        return this.getPartyNameCallStatus.fb_submitted;
    }

    onRemoveCompanyFromList(networkIndex:number,companyIndex:number) {
        this.networkGroups[networkIndex].vatNumber.splice(companyIndex,1);
    }

    onAddCompanyToList(networkIndex:number): void {
        this.networkCompanyListService.reset();
        this.networkCompanyListService.networks = copy(this.networkGroups);
        this.networkCompanyListService.selectedNetworkIndex = networkIndex;
        this.networkCompanyListService.selectedPartiesInSolrFormat = [];
        for(let vatNumber of this.networkGroups[networkIndex].vatNumber){
            this.networkCompanyListService.selectedPartiesInSolrFormat.push({"vatNumber":vatNumber,"legalName":this.partyNameMap.get(vatNumber)})
        }

        this.router.navigate(['/simple-search'], { queryParams: { sTop: 'comp', pageRef: 'network' } });
    }

}
