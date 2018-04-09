import * as constants from '../../constants';

/**
 * Created by suat on 28-Mar-18.
 */
export class ProcessInstanceGroupFilter {
    constructor(public partyID: string = null,
                public tradingPartnerIDs: string[] = [],
                public tradingPartnerNames: string[] = [],
                public relatedProducts: string[] = [],
                public relatedProductCategories: string[] = [],
                public startDate: string = "",
                public endDate: string = "") {
    }
}