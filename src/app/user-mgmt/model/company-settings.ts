/*
 * Copyright 2020
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
   In collaboration with
 * UB - University of Bremen, Faculty of Production Engineering; Bremen; Germany
 * BIBA - Bremer Institut für Produktion und Logistik GmbH; Bremen; Germany
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

import { Certificate } from './certificate';
import { CompanyDescription } from './company-description';
import { CompanyDetails } from './company-details';
import { CompanyTradeDetails } from './company-trade-details';
import { CompanyNegotiationSettings } from './company-negotiation-settings';

export class CompanySettings {
    constructor(
        public certificates: Certificate[],
        public companyID: string,
        public description: CompanyDescription,
        public details: CompanyDetails,
        public preferredProductCategories: string[],
        public recentlyUsedProductCategories: string[],
        public tradeDetails: CompanyTradeDetails,
        public negotiationSettings: CompanyNegotiationSettings
    ) { }
}
