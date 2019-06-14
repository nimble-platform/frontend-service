import { Component, ViewChild, ViewEncapsulation, OnInit } from '@angular/core';
import { Search } from './model/search';
import { TnTService } from './tnt.service';
import * as moment from 'moment';
import * as d3 from 'd3';
import * as myGlobals from '../globals';

@Component({
    selector: 'tnt-form',
    templateUrl: './tnt-form.component.html',
    styleUrls: ['./tnt-form.component.css'],
    providers: [TnTService],
    encapsulation: ViewEncapsulation.None
})

export class TnTFormComponent {
    public model = new Search('');
    @ViewChild('acc') acc;
    public metaData = {};
    orientation: String = 'BT';
    public trackingInfo: object[] = [];
    public bpInfo = [];
    public hierarchialGraph = {nodes: [], links: []};
    debug = myGlobals.debug;
    error_detc = false;
    updateInfo = false;
    hideButton = false;
    curve = d3.curveBundle.beta(1);
    gateInformation = [];
    bizLocationInformation = [];
    currentGate: string;
    currentBizLoc: string;
    sstInfo = [];
    falsecode = '';
    verified: boolean;

    constructor(private tntBackend: TnTService) {}

    ngOnInit(): void {
        this.updateInfo = true;
    }

    Search(code: string) {
        if (this.debug) {
            console.log(code);
        }
        this.clearData();
        this.tntBackend.getMetaData(code)
            .then(resp => {
                this.error_detc = false;
                this.getTableInfo(resp);
                this.bpInfo = resp;
                this.showGraph();
                this.verifyOnBlockchain();
            })
            .catch(error => {
                if (error.status === 404) {
                    // console.log(error);
                    this.falsecode = error._body;
                }
                this.error_detc = true;
            });
    }

    clearData() {
        this.falsecode = '';
        this.metaData = {};
        this.bpInfo = [];
        this.trackingInfo = [];
        this.hierarchialGraph = {nodes: [], links: []};
        this.gateInformation = [];
        this.sstInfo = [];
        this.hideButton = false;
    }

    getTableInfo(data) {
                this.trackingInfo = data.map(el => {
                    let _out = {
                        'eventTime': moment(Number(el.eventTime.$date)),
                        'bizStep': el.bizStep.split(':').pop(),
                        'action': el.action,
                        'readPoint': el.readPoint.id.split(':').pop(),
                    };
                    if ('bizLocation' in el) {
                        _out['bizLocation'] = el.bizLocation.id.split(':').pop();
                        return _out;
                    }
                    return _out;
                });
    }

    showGraph() {
        this.bpInfo.reverse().forEach((el, index) => {
            this.hierarchialGraph.nodes.push({
                id: index.toString(),
                label: el.readPoint.id.split(':').pop()
            });
            this.hierarchialGraph.links.push({
                source: index.toString(),
                target: (index + 1).toString(),
                label: el.bizStep.split(':').pop()
            });
        });
        this.hierarchialGraph.links.pop();
    }

    getGateInfo(gateName) {
        let selectedGate = this.bpInfo.find(el => el.readPoint.id.split(':').pop() === gateName);
        if (this.debug) {
            console.log(selectedGate);
        }
        this.currentGate = gateName;
         this.tntBackend.getGateInfo(selectedGate.readPoint.id)
            .then(resp => {
                this.gateInformation = resp;
                }
            )
            .catch(err => {
                this.falsecode = err._body;
            });

    }

    getBizLocInfo(bizLocName) {
        let selectedLocation = this.bpInfo.find(el => el.bizLocation.id.split(':').pop() === bizLocName);
        if (this.debug) {
            console.log(selectedLocation);
        }
        this.currentBizLoc = bizLocName;
        this.tntBackend.getGateInfo(selectedLocation.bizLocation.id)
            .then(resp => {
                    this.bizLocationInformation = resp;
                }
            )
            .catch(err => {
                this.falsecode = err._body;
            });
    }

    getSST(sstDescp) {
        this.tntBackend.getSubSiteTypeInfo(this.metaData['masterUrl'], sstDescp)
            .then(res => {
                this.error_detc = false;
                this.sstInfo = res;
            })
            .catch(error => {
                this.error_detc = true;
                this.falsecode = error._body;
            });
    }

    verifyOnBlockchain() {
        let result = this.tntBackend.verifyOnBC(this.bpInfo)
            .then(res => {
                if (this.debug) {
                    console.log(res);
                }
                // result = res;
                this.verified = res;
                // this.verified = true;
            })
            .catch(err => {
                this.falsecode = err._body;
            });
    }
}
