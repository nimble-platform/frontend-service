import { Component, Input, OnChanges, ViewEncapsulation } from '@angular/core';
import { TrackInfo } from './model/trackinfo';
import * as myGlobals from '../globals';
import { TnTService } from './tnt.service';
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
    bcEventVerified: boolean;
    falsecode = '';
    gateInformation = [];
    bizLocationInformation = [];
    dashboardURL = 'https://grafana5.ips.biba.uni-bremen.de/d-solo/FhrdyH2Wk/nimble-epcis-iot-testbed';
    dashboardQuery: any;
    selectedBizLocation = '';

    constructor(private tntBackend: TnTService) {}

    ngOnChanges() {
        if (!this.events.length) {
            return;
        }
        this.bcEventVerified = this.events[0].verified;
        this.getGateInfo();
        this.getBizLocInfo();
        this.displaySensorDashboard();
        this.callIoTBCApi();
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
        // console.log(this.selectedBizLocation);
        let fromTimeStamp = Number(this.events[1].eventTime);
        let toTimeStamp = Number(this.events[0].eventTime);
        this.dashboardQuery =
            `${this.dashboardURL}?var-bizLocation=${encodeURIComponent(this.selectedBizLocation)}` +
            `&from=${fromTimeStamp}&to=${toTimeStamp}&orgId=2&panelId=2"`;
        console.log(this.dashboardQuery);
    }

    callIoTBCApi() {
        let fromTimeStamp = moment(this.events[1].eventTime).toISOString();
        let toTimeStamp = moment(this.events[0].eventTime).toISOString();
        console.log(this.events[0].epc);
        console.log(fromTimeStamp);
        console.log(toTimeStamp);
        this.tntBackend.testIOTBC(this.events[0].epc,
         {'from': fromTimeStamp, 'to': toTimeStamp})
        .then(resp => {
            console.log(resp);
        })
    }

}
