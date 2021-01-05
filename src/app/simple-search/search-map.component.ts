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

import {Component, Input} from '@angular/core';
import * as L from 'leaflet';
import 'style-loader!leaflet/dist/leaflet.css';
import {Router} from '@angular/router';
import {selectNameFromLabelObject} from '../common/utils';

@Component({
    selector: 'search-map',
    templateUrl: './search-map.component.html'
})

export class SearchMapComponent {

    @Input() companyData: any[];

    options = {
        layers: [
            L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom: 18}),
        ],
        zoom: 5,
        center: L.latLng(39.4078968, -0.4317229)
    };

    map: L.Map;

    constructor(router: Router) {
    }

    onMapReady(map: L.Map): void {
        const icon = new L.Icon.Default();
        icon.options.shadowSize = [0, 0];

        // this.markers = [];
        // this.markers.push(marker([55, 55], {icon: icon}));
        // this.markers.push(marker([6, 6], {icon: icon}));
        this.map = map;
        this.companyData.forEach(c => {
            // TODO check search result
            const m = L.marker([c.coordinate.longitude, c.coordinate.latitude], {icon: icon});
            m.bindPopup(this.getPopupContent(c));
            m.on('mouseover', function (e) {
                this.openPopup();
            });
            m.on('mouseout', function (e) {
                this.closePopup();
            });
            m.on('click', function (e) {
                this.router.navigate(['/user-mgmt/company-details'], {queryParams: {id: c.id}})
            });
            m.addTo(this.map);
        });
    }

    private getPopupContent(partySearchResult: any): string {
        let name: string = selectNameFromLabelObject(partySearchResult.brandName);
        if (!name) {
            name = partySearchResult = partySearchResult.legalName;
        }
        return partySearchResult;
    }
}
