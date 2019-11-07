import { Component, Input, OnChanges } from '@angular/core';
import { TrackInfo } from './model/TrackInfo';

@Component({
    selector: 'tnt-event-data',
    templateUrl: './tnt-event-data.component.html',
    styleUrls: ['./tnt-event-data.component.css']
})

export class TnTEventDataComponent implements OnChanges {
    @Input('incomingTrackingInfo') incomingTrackingInfo: TrackInfo[];
    collectionSize = 0;
    page = 1;
    pageSize = 5;
    verified: boolean;
    selectedEvent = {};
    eventsToDescribe: TrackInfo[] = [];

    ngOnChanges() {
        if (!this.incomingTrackingInfo.length) {
            return;
        }
        this.selectedEvent = {};
        this.eventsToDescribe = [];
    }

    get events(): TrackInfo[] {
        const everyEvent = this.incomingTrackingInfo;
        this.collectionSize = everyEvent.length;
        return everyEvent.slice((this.page - 1) * this.pageSize, (this.page - 1) * this.pageSize + this.pageSize);
    }

    eventSelection(event: TrackInfo, presentIndex: number) {
        this.eventsToDescribe = []; // reset on every button press
        this.selectedEvent = event; // highlight the event
        if (presentIndex < this.incomingTrackingInfo.length - 1) {
            this.eventsToDescribe.push(this.incomingTrackingInfo[presentIndex]); // push the selected Event
            this.eventsToDescribe.push(this.incomingTrackingInfo[presentIndex + 1]); // push the previously occured event
        } else {
            console.log('The First ever Event in the chain');
        }
    }
}
