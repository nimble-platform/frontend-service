/*
 * Copyright 2020
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
   In collaboration with
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
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

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { BP } from './model/bp';
import { BPService } from './bp.service';

@Component({
    selector: 'my-bps',
    templateUrl: './bps.component.html'
})
export class BPsComponent implements OnInit {
    bps: BP[];

    constructor(
        private bpService: BPService,
        private router: Router) { }

    getBPs(): void {
        this.bpService
            .getBPs()
            .subscribe(bps => this.bps = bps);
    }

    delete(bp: BP): void {
        this.bpService
            .delete(bp.processID)
            .subscribe(() => {
                this.bps = this.bps.filter(h => h !== bp);
            });
    }

    ngOnInit(): void {
        this.getBPs();
    }

    edit(bp: BP): void {
        this.router.navigate(['bpe/bpe-design/detail', bp.processID]);
    }

    configure(bp: BP): void {
        this.router.navigate(['bpe/bpe-design/configure', bp.processID]);
    }

    create(): void {
        this.router.navigate(['bpe/bpe-design/create']);
    }
}
