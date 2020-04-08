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

import { PeriodRange } from "./period-range";
import { PAYMENT_MEANS, INCOTERMS } from "../../catalogue/model/constants";
import { UBLModelUtils } from "../../catalogue/model/ubl-model-utils";
import { UnitService } from "../../common/unit-service";
import { ServiceBridge } from "../../common/ServiceBridge";
import { deliveryPeriodUnitListId, warrantyPeriodUnitListId } from "../../common/constants";
import { Party } from '../../catalogue/model/publish/party';
import { CompanySensor } from "./company-sensor";

export class CompanyNegotiationSettings {
    constructor(
        public paymentMeans: string[] = [].concat(PAYMENT_MEANS),
        public paymentTerms: string[] = UBLModelUtils.getDefaultPaymentTermsAsStrings(),
        public incoterms: string[] = [].concat(INCOTERMS),
        public deliveryPeriodRanges: PeriodRange[] = [{ start: 0, end: 2500 }, { start: 0, end: 75 }, { start: 0, end: 100 }, { start: 0, end: 15 }, { start: 1, end: 12 }],
        public deliveryPeriodUnits: string[] = [],
        public warrantyPeriodRanges: PeriodRange[] = [{ start: 0, end: 48 }, { start: 0, end: 4 }],
        public warrantyPeriodUnits: string[] = [],
        public company: Party = null,
        public serviceLevel: string = 'None',
        public sensors: CompanySensor[] = [],
    ) {
        let unitService: UnitService = ServiceBridge.unitService;
        unitService.getCachedUnitList(deliveryPeriodUnitListId).then(list => this.deliveryPeriodUnits = list);
        unitService.getCachedUnitList(warrantyPeriodUnitListId).then(list => this.warrantyPeriodUnits = list);
    }
}
