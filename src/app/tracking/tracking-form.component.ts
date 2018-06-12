import { Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { Search } from './model/search';
import {TrackingService} from './tracking.service';
import * as moment from 'moment';
import * as shape from 'd3-shape';

@Component({
    selector: 'tracking-form',
    templateUrl: './tracking-form.component.html',
    styleUrls: ['./tracking-form.component.css'],
    providers: [TrackingService],
    encapsulation: ViewEncapsulation.None
})

export class TrackingFormComponent {
    public model = new Search('');
    @ViewChild('acc') acc;
    public metaData = {};
    public trackingInfo: object[] = [];
    public bpInfo = [];
    public hierarchialGraph = {nodes: [], links: []};
    hideButton = false;
    curve = shape.curveBundle.beta(1);
    gateInformation = [];
    sstInfo = [];

    constructor(private tntBackend: TrackingService) {}

    Search(code: string) {
        console.log(code);
        this.tntBackend.getMetaData(code)
            .then(resp => {
                this.metaData = resp;
                if ('productionProcessTemplate' in this.metaData) {
                    // this.getBPInfo(resp['productionProcessTemplate']);
                    this.getAnalysis(code);
                    this.acc.toggle('tableInfo');
                }
                if ('eventUrl' in resp) {
                    this.getTableInfo(resp['eventUrl'], code);
                }
            });
    }

    getTableInfo(url, code) {
        this.tntBackend.getTrackingInfo(url, code)
            .subscribe(resp_track => {
                this.trackingInfo = resp_track.map(el => {
                    let _out = {
                        'eventTime': moment(el.eventTime.$date).utcOffset(el.eventTimeZoneOffset).toString(),
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
            });
    }

    getBPInfo(url) {
        this.tntBackend.getBusinessProcessInfo(url)
            .subscribe(res => {
                this.bpInfo = res;
            })
    }

    getAnalysis(code) {
        this.tntBackend.getAnalysisInfo(code)
            .subscribe(res => {
                this.bpInfo = res;
            });
    }

    showGraph() {
        this.bpInfo.forEach((step) => {
            if (step['estimatedEventTime'] === null) {
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
        console.log(selectedNode);
        this.tntBackend.getGateInfo(this.metaData['masterUrl'], selectedNode.readPoint)
            .then(res => {
                this.gateInformation = res;
                console.log(this.gateInformation);
            })
    }

    getSST(sstDescp) {
        this.tntBackend.getSubSiteTypeInfo(this.metaData['masterUrl'], sstDescp)
            .then(res => {
                this.sstInfo = res;
            })
    }
}
