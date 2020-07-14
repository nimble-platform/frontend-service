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

@Injectable()
export class WhiteBlackListService {
    // catalogue identifier
    catalogueId:string = null;
    // whether the companies are selected for the white or black list
    listMode: 'White'|'Black' = null
    // companies selected in the search process to be added to the White/Black list
    private selectedPartiesInSearchForWhiteList:any[] = [];
    // companies selected in the search process to be added to the White/Black list
    private selectedPartiesInSearchForBlackList:any[] = [];

    reset(){
        this.catalogueId = null;
        this.listMode = null;
        this.selectedPartiesInSearchForBlackList = [];
        this.selectedPartiesInSearchForWhiteList = [];
    }

    setSelectedPartiesInSearchForWhiteList(parties:any[]){
        this.selectedPartiesInSearchForWhiteList = parties;
    }

    setSelectedPartiesInSearchForBlackList(parties:any[]){
        this.selectedPartiesInSearchForBlackList = parties;
    }

    onAddSelectedCompany(company: any): void {
        if(this.listMode == 'White'){
            this.selectedPartiesInSearchForWhiteList.push(company);
        } else {
            this.selectedPartiesInSearchForBlackList.push(company);
        }
    }

    onRemoveSelectedCompany(removedCompanyVatNumber: any): void {
        if(this.listMode == 'White'){
            let selectedIndex: number = this.selectedPartiesInSearchForWhiteList.findIndex(company => company.vatNumber === removedCompanyVatNumber);
            this.selectedPartiesInSearchForWhiteList.splice(selectedIndex, 1);
        } else {
            let selectedIndex: number = this.selectedPartiesInSearchForBlackList.findIndex(company => company.vatNumber === removedCompanyVatNumber);
            this.selectedPartiesInSearchForBlackList.splice(selectedIndex, 1);
        }
    }

    isCompanySelected(companyVatNumber:string){
        let index;
        if(this.listMode == 'White'){
            index= this.selectedPartiesInSearchForWhiteList.findIndex(company => company.vatNumber === companyVatNumber);
        } else {
            index = this.selectedPartiesInSearchForBlackList.findIndex(company => company.vatNumber === companyVatNumber);
        }
        return index != -1;
    }

    getSelectedCompanies(listMode:'White'|'Black'=null){
        let mode =  listMode || this.listMode;
        if(mode == 'White'){
            return this.selectedPartiesInSearchForWhiteList;
        } else {
            return this.selectedPartiesInSearchForBlackList;
        }
    }
}
