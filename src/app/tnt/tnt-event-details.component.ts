import { Component, Input, OnChanges, ViewEncapsulation } from '@angular/core';
import { TrackInfo } from './model/trackinfo';
import * as myGlobals from '../globals';
import { TnTService } from './tnt.service';
import { TranslateService } from '@ngx-translate/core';
import moment = require('moment');


@Component({
    selector: 'tnt-event-details',
    templateUrl: './tnt-event-details.component.html',
    styleUrls: ['./tnt-event-details.component.css'],
    providers: [TnTService],
    encapsulation: ViewEncapsulation.None
})

export class TnTEventDetailsComponent implements OnChanges {
    @Input('eventsToDisplay') events: TrackInfo[];
    debug = myGlobals.debug;
    bcIoTDataVerified: boolean;
    bcEventVerified: boolean;
    falsecode = '';
    gateInformation = [];
    bizLocationInformation = [];
    dashboardURL = 'https://grafana5.ips.biba.uni-bremen.de/d-solo/FhrdyH2Wk/nimble-epcis-iot-testbed';
    dashboardQuery: string;
    selectedBizLocation = '';

    constructor(private tntBackend: TnTService, private translate: TranslateService) {}

    ngOnChanges() {
        if (!this.events.length) {
            return;
        }

        // Get Event Information irrespective if last event
        this.bcEventVerified = this.events[0].verified;
        this.getGateInfo();
        this.getBizLocInfo();

        if (this.events.length > 1) {
            // Display IoT information only if there was a previous event
            // Avoid calling this information on the last event
            this.bcIoTDataVerified = false;
            this.displaySensorDashboard();
            this.callIoTBCApi();
        } else {
            // clear out any previous Sensor Data Dashboard
            this.dashboardQuery = '';
        }
    }

    getGateInfo() {
        if (this.debug) {
            console.log(this.events[0].readPoint);
        }
        const prefix = 'urn:epc:id:sgln:';
         this.tntBackend.getGateInfo(prefix + this.events[0].readPoint)
            .then(resp => {
                this.gateInformation = resp;
                }
            )
            .catch(err => {
                this.falsecode = err._body;
            });

    }

    getBizLocInfo() {
        if (this.debug) {
            console.log(this.events[0].bizLocation);
        }
        const prefix = 'urn:epc:id:sgln:';
        this.selectedBizLocation = prefix + this.events[0].bizLocation;
        this.tntBackend.getGateInfo(prefix + this.events[0].bizLocation)
            .then(resp => {
                    this.bizLocationInformation = resp;
                }
            )
            .catch(err => {
                this.falsecode = err._body;
            });
    }

    displaySensorDashboard() {
        let fromTimeStamp = Number(this.events[1].eventTime);
        let toTimeStamp = Number(this.events[0].eventTime);
        this.dashboardQuery =
            `${this.dashboardURL}?var-bizLocation=${encodeURIComponent(this.selectedBizLocation)}` +
            `&from=${fromTimeStamp}&to=${toTimeStamp}&orgId=2&panelId=2"`;

        if (this.debug) {
            console.log(this.selectedBizLocation);
            console.log(this.dashboardQuery);
        }
    }

    callIoTBCApi() {
        let fromTimeStamp = moment(this.events[1].eventTime).toISOString();
        let toTimeStamp = moment(this.events[0].eventTime).toISOString();
        if (this.debug) {
            console.log(this.events[0].epc);
            console.log(fromTimeStamp);
            console.log(toTimeStamp);
        }
        let verification_query = {
            'productID': this.events[0].epc,
            'from': fromTimeStamp,
            'to': toTimeStamp
        };
        this.tntBackend.verifyIOTBC(verification_query)
        .then(resp => {
            if (this.debug) {
                console.log(resp);
            }
            this.bcIoTDataVerified = resp['validated'];
        }).catch(err => {
            console.log(err);
        })
    }

}
