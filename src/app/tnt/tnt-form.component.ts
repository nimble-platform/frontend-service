/**
 * Copyright 2020
 * University of Bremen, Faculty of Production Engineering, Badgasteiner Straße 1, 28359 Bremen, Germany.
 * In collaboration with BIBA - Bremer Institut für Produktion und Logistik GmbH, Bremen, Germany.
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

import { Component } from '@angular/core';
import { Search } from './model/search';
import { TnTService } from './tnt.service';
import * as myGlobals from '../globals';

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

    constructor(private tntBackend: TnTService) {
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
                    this.falsecode = error._body;
                }
                this.error_detc = true;
            });
    }

    clearData() {
        this.falsecode = '';
        this.bpInfo = [];
        this.trackingInfo = [];
        this.verified = false;
    }

    getTableInfo(code: string, data: any) {
        this.trackingInfo = data.map((el: any) => {
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
                this.verified = (res === 'true');
            })
            .catch(err => {
                this.falsecode = err._body;
            });
    }
}
