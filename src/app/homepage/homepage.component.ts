/*
 * Copyright 2020
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
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

import {Component} from '@angular/core';
import {CookieService} from 'ng2-cookies';
import * as myGlobals from '../globals';
import {Router} from '@angular/router';

@Component({
    selector: 'homepage',
    providers: [CookieService],
    templateUrl: './homepage.component.html',
    styleUrls: ['./homepage.component.css']
})

export class HomepageComponent {

    public config = myGlobals.config;

    constructor(private router: Router) {}

    ngOnInit(): void {
    }

    /**
     * Template handlers
     */

    onPublishProductClicked(): void {
        this.router.navigate(['catalogue/publish'], { queryParams: { pg: 'single' } });
    }

    scroll(el: HTMLElement) {
        el.scrollIntoView({behavior: 'smooth'});
    }
}
