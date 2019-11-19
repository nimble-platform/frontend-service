import { Component, Input, OnChanges } from '@angular/core';
import { TrackInfo } from './model/TrackInfo';
import * as myGlobals from '../globals';

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
    selectedEvent = {};
    eventsToDescribe: TrackInfo[] = [];
    debug = myGlobals.debug;

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

    eventSelection(event: TrackInfo) {
        this.eventsToDescribe = []; // reset on every button press
        this.selectedEvent = event; // highlight the event
        let selectedEventIndex = this.incomingTrackingInfo.findIndex(el => el.eventTime === event.eventTime);
        if (this.debug) {
            console.log('selectedEventIndex ', selectedEventIndex);
        }
        if (selectedEventIndex === (this.incomingTrackingInfo.length - 1)) {
            if (this.debug) {
                console.log('First ever event in the Tracking Chain! No previous Event happened!');
            }
            this.eventsToDescribe.push(event);
        } else {
            this.eventsToDescribe.push(this.incomingTrackingInfo[selectedEventIndex]); // push the selected Event
            this.eventsToDescribe.push(this.incomingTrackingInfo[selectedEventIndex + 1]); // push the previously occured event
            if (this.debug) {
                console.log(this.eventsToDescribe);
            }
        }
    }
}
