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

import { Injectable } from "@angular/core";
import {Network} from '../catalogue/model/publish/network';
import {ProductOfferingDetails} from '../catalogue/model/publish/product-offering-details';

@Injectable()
export class NetworkCompanyListService {

    // need to keep all networks info to not lose any information when the user is navigated to the company search page
    networks: Network[] = null;
    // index of the selected network for which the companies will be added to
    selectedNetworkIndex: number = null;

    // details of the offer
    productOfferingDetails:ProductOfferingDetails = null;

    // companies selected in the search process to be added to the Network
    public selectedPartiesInSolrFormat:any[] = [];


    reset(){
        this.networks = null;
        this.selectedNetworkIndex = null;
        this.productOfferingDetails = null;
        this.selectedPartiesInSolrFormat = [];
    }

    onAddSelectedCompany(company: any): void {
        this.selectedPartiesInSolrFormat.push(company);
        if(this.networks){
            this.networks[this.selectedNetworkIndex].vatNumber.push(company.vatNumber);
        }
        else{
            this.productOfferingDetails.vatNumber.push(company.vatNumber);
        }
    }

    onRemoveSelectedCompany(companyVATNumber:any): void {
        let selectedIndex: number = this.selectedPartiesInSolrFormat.findIndex(company => company.vatNumber === companyVATNumber);
        this.selectedPartiesInSolrFormat.splice(selectedIndex, 1);

        if(this.networks){
            selectedIndex = this.networks[this.selectedNetworkIndex].vatNumber.findIndex(vatNumber => vatNumber === companyVATNumber);
            this.networks[this.selectedNetworkIndex].vatNumber.splice(selectedIndex,1);
        } else{
            selectedIndex =  this.productOfferingDetails.vatNumber.findIndex(vatNumber => vatNumber === companyVATNumber);
            this.productOfferingDetails.vatNumber.splice(selectedIndex,1);
        }
    }

    isCompanySelected(companyVatNumber:string){
        return this.selectedPartiesInSolrFormat.findIndex(company => company.vatNumber === companyVatNumber) != -1;
    }
}
