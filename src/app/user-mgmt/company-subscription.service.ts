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
export class CompanySubscriptionService {

    // keeps the selected companies in the following format:
    // {
    //  id: <COMPANY_ID>,
    //  legalName: <COMPANY_LEGAL_NAME>,
    //  businessType: <COMPANY_BUSINESS_TYPE>,
    //  businessKeywords: <COMPANY_BUSINESS_KEYWORDS>
    // }
    public selectedCompanies: any[] = null;

    reset(){
        this.selectedCompanies = null;
    }

    onAddSelectedCompany(company: any): void {
        if(this.selectedCompanies === null){
            this.selectedCompanies = [company];
        } else{
            this.selectedCompanies.push(company);
        }
    }

    onRemoveSelectedCompany(companyId:any): void {
        this.selectedCompanies = this.selectedCompanies.filter(selectedCompany => selectedCompany.id !== companyId);
    }

    isCompanySelected(companyId:string){
        return this.selectedCompanies && this.selectedCompanies.findIndex(company => company.id === companyId) != -1;
    }
}
