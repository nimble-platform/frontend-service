import { CompanyEvent } from './company-event';

export class CompanyDescription {
    constructor(
        public companyPhotoList: string[],
        public companyStatement: {},
        public externalResources: string[],
        public logoImageId: string,
        public socialMediaList: string[],
        public events: CompanyEvent[],
        public website: string,
    ) {  }
}
