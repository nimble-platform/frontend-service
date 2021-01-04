import {Demand} from '../catalogue/model/publish/demand';
import {Injectable} from '@angular/core';

@Injectable()
export class DemandPublishService {
    // demand being published
    public modifiedDemand: Demand;
    public publishMode: 'create' | 'edit';

    public resetData(): void {
        this.modifiedDemand = null;
        this.publishMode = null;
    }
}
