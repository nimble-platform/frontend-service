/*
 * Copyright 2020
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

import {Quantity} from '../publish/quantity';
import {CompanyNegotiationSettings} from '../../../user-mgmt/model/company-negotiation-settings';

export class TermsAndConditionUtils {
    /**
     * Returns the warranty period for the specified unit. If the unit does not match with the available ones, the last period is returned.
     * @param companyNegotiationSettings
     */
    public static getWarrantyPeriod(companyNegotiationSettings: CompanyNegotiationSettings, unitLike = 'year'): Quantity {
        let warrantyPeriodIndex: number = companyNegotiationSettings.warrantyPeriodUnits.findIndex(unit => unit.includes(unitLike));
        warrantyPeriodIndex = warrantyPeriodIndex !== -1 ? warrantyPeriodIndex : companyNegotiationSettings.warrantyPeriodRanges.length - 1;

        const warrantyPeriod: Quantity = new Quantity(
            companyNegotiationSettings.warrantyPeriodRanges[warrantyPeriodIndex].end,
            companyNegotiationSettings.warrantyPeriodUnits[warrantyPeriodIndex]
        );
        return warrantyPeriod
    }

    /**
     * Returns the delivery period for the specified unit. If the unit does not match with the available ones, daily period is checked.
     * If it still does not exist, the first period is returned.
     * @param companyNegotiationSettings
     */
    public static getDeliveryPeriod(companyNegotiationSettings: CompanyNegotiationSettings, unitLike = 'day'): Quantity {
        let deliveryPeriodIndex: number = companyNegotiationSettings.deliveryPeriodUnits.findIndex(unit => unit.includes(unitLike));
        if (deliveryPeriodIndex === -1) {
            deliveryPeriodIndex = companyNegotiationSettings.deliveryPeriodUnits.findIndex(unit => unit.includes('day'));
        }

        const deliveryPeriod: Quantity = new Quantity(
            companyNegotiationSettings.deliveryPeriodRanges[deliveryPeriodIndex].start,
            companyNegotiationSettings.deliveryPeriodUnits[deliveryPeriodIndex]
        );
        return deliveryPeriod;
    }
}
