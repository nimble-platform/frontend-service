import { Component, Input, OnChanges } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { TrackInfo } from './model/trackinfo';
import * as myGlobals from '../globals';
import { TnTService } from './tnt.service';

@Component({
    selector: 'tnt-event-details',
    templateUrl: './tnt-event-details.component.html',
    styleUrls: ['./tnt-event-details.component.css'],
    providers: [TnTService]
})

export class TnTEventDetailsComponent implements OnChanges {
    @Input('eventToDisplay') event: TrackInfo;
    debug = myGlobals.debug;
    falsecode = '';
    gateInformation = [];
    bizLocationInformation = [];
    dashboardURL = 'https://grafana5.ips.biba.uni-bremen.de/d-solo/FhrdyH2Wk/nimble-epcis-iot-testbed';
    dashboardQuery: any;
    selectedBizLocation = '';
    selectedTimeStamp = 0;

    constructor(private tntBackend: TnTService, private dom: DomSanitizer) {}

    ngOnChanges() {
        if (!this.event) {
            return;
        }
        this.getGateInfo();
        this.getBizLocInfo();
    }

    getGateInfo() {
        if (this.debug) {
            console.log(this.event.readPoint);
        }
        const prefix = 'urn:epc:id:sgln:';
         this.tntBackend.getGateInfo(prefix + this.event.readPoint)
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
            console.log(this.event.bizLocation);
        }
        const prefix = 'urn:epc:id:sgln:';
        this.selectedBizLocation = prefix + this.event.bizLocation;
        this.tntBackend.getGateInfo(prefix + this.event.bizLocation)
            .then(resp => {
                    this.bizLocationInformation = resp;
                }
            )
            .catch(err => {
                this.falsecode = err._body;
            });
    }

    displaySensorDashboard() {
        console.log(this.selectedBizLocation);
        this.selectedTimeStamp = this.bizLocationInformation[this.bizLocationInformation.length - 1]['lastUpdated']['$date'];
        console.log(this.selectedTimeStamp);
        this.dashboardQuery =
            `${this.dashboardURL}?var-bizLocation=${encodeURIComponent(this.selectedBizLocation)}` +
            `&from=${this.selectedTimeStamp}&to=${this.selectedTimeStamp + 3600000}&orgId=2&panelId=2"`;
        console.log(this.dashboardQuery);
    }

}
