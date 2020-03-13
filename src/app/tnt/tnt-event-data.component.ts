/**
 * Copyright 2020 Universität Bremen/BIBA - Bremer Institut für Produktion und Logistik GmbH

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

import { Component, Input, OnChanges } from '@angular/core';
import { TrackInfo } from './model/trackinfo';
import * as myGlobals from '../globals';
import { TranslateService } from '@ngx-translate/core';

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

    constructor(private translate: TranslateService) {}

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
