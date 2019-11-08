import { Component } from '@angular/core';
import { Search } from './model/search';
import { TnTService } from './tnt.service';
import * as myGlobals from '../globals';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'tnt-form',
    templateUrl: './tnt-form.component.html',
    styleUrls: ['./tnt-form.component.css'],
    providers: [TnTService]
})

export class TnTFormComponent {
    public model = new Search('');
    public trackingInfo: object[] = [];
    public bpInfo = [];
    debug = myGlobals.debug;
    error_detc = false;
    falsecode = '';
    verified: boolean;

    constructor(private tntBackend: TnTService, private translate: TranslateService) {
    }

    Search(code: string) {
        if (this.debug) {
            console.log(code);
        }
        this.clearData();
        this.tntBackend.getMetaData(code)
            .then(resp => {
                this.error_detc = false;
                this.getTableInfo(code, resp);
                this.bpInfo = resp;
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
        this.bpInfo = [];
        this.trackingInfo = [];
    }

    getTableInfo(code, data) {
                this.trackingInfo = data.map(el => {
                    let _out = {
                        'epc': code,
                        'eventTime': el.eventTime.$date,
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

    verifyOnBlockchain() {
        this.tntBackend.verifyOnBC(this.bpInfo)
            .then(res => {
                if (this.debug) {
                    console.log(res);
                }
                this.verified = res;
            })
            .catch(err => {
                this.falsecode = err._body;
            });
    }
}
