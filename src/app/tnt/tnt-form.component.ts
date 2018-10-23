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
    public trackingInfo: object[] = [];
    public bpInfo = [];
    public hierarchialGraph = {nodes: [], links: []};
    debug = myGlobals.debug;
    error_detc = false;
    updateInfo = false;
    hideButton = false;
    curve = d3.curveBundle.beta(1);
    gateInformation = [];
    sstInfo = [];
    falsecode = '';

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
                this.updateInfo = false;
                this.metaData = resp;
                if ('productionProcessTemplate' in this.metaData) {
                    this.getBPInfo(resp['productionProcessTemplate']);
                    this.getAnalysis(code);
                    if (!(this.acc.activeIds.findIndex(tab => tab === 'bProcessVis') > -1)) {
                        this.acc.toggle('bProcessVis');
                    }
                }
                if ('eventUrl' in resp) {
                    this.getTableInfo(resp['eventUrl'], code);
                    if (!(this.acc.activeIds.findIndex(tab => tab === 'tableInfo') > -1)) {
                        this.acc.toggle('tableInfo');
                    }
                }
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

    getTableInfo(url, code) {
        this.tntBackend.getTrackingInfo(url, code)
            .subscribe((resp_track) => {
                this.error_detc = false;
                this.trackingInfo = resp_track.map(el => {
                    let _out = {
                        'eventTime': moment(Number(el.eventTime.$numberLong)),
                        'bizStep': el.bizStep.split(':').pop(),
                        'action': el.action,
                        'readPoint': el.readPoint.id.split(':').pop(),
                        'bizLocation': ''
                    };
                    if ('bizLocation' in el) {
                        _out['bizLocation'] = el.bizLocation.id.split(':').pop();
                        return _out;
                    }
                    return _out;
                });
            }, (err) => {
                this.error_detc = true;
            });
    }

    getBPInfo(url) {
        if (this.debug) {
            console.log(url);
        }
        this.tntBackend.getBusinessProcessInfo(url)
            .subscribe((res) => {
                this.error_detc = false;
                this.bpInfo = res;
            }, (err) => {
                this.error_detc = true;
            });
    }

    getAnalysis(code) {
        this.tntBackend.getAnalysisInfo(code)
            .subscribe((res) => {
                this.error_detc = false;
                if (res.length) {
                    this.bpInfo = res;
                }
            }, (err) => {
                this.error_detc = true;
            });
    }

    showGraph() {
        this.bpInfo.forEach((step) => {
            if (step['estimatedEventTime'] === null || !('estimatedEventTime' in step)) {
                this.hierarchialGraph.nodes.push({
                    id: step.id,
                    label: step.bizStep.split(':').pop(),
                    color: 'green',
                    status: 'Step Fulfilled'
                });
            } else {
                this.hierarchialGraph.nodes.push({
                    id: step.id,
                    label: step.bizStep.split(':').pop(),
                    color: 'gray',
                    status: 'Estimated Time for Completion:\n' + moment(step.estimatedEventTime.$date).toString()
                });
            }
            this.hierarchialGraph.links.push({source: step.id, target: step.hasNext});
        });
        this.hierarchialGraph.links.pop(); // remove to last link pointing to nothing
        this.hideButton = true;
    }

    selectNode(ev) {
        let selectedNode = this.bpInfo.find(el => el.id === ev.id);
        if (this.debug) {
            console.log(this.bpInfo);
            console.log(selectedNode);
        }
        this.tntBackend.getGateInfo(this.metaData['masterUrl'], selectedNode.readPoint)
            .then(res => {
                this.error_detc = false;
                this.gateInformation = res;
                if (this.debug) {
                    console.log(this.gateInformation);
                }
            })
            .catch(error => {
                this.error_detc = true;
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
            });
    }
}
