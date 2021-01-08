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

import {Component, Input, NgZone} from '@angular/core';
import * as L from 'leaflet';
import 'style-loader!leaflet/dist/leaflet.css';
import {Router} from '@angular/router';
import {selectNameFromLabelObject} from '../common/utils';
import {UserService} from '../user-mgmt/user.service';
import {Address} from '../user-mgmt/model/address';
import {TranslateService} from '@ngx-translate/core';

@Component({
    selector: 'search-map',
    templateUrl: './search-map.component.html'
})

export class SearchMapComponent {

    // search results could be either product search results or company search results. They are differentiated by checking the
    // manufacturer field of a result
    @Input() searchResults: any[];
    @Input() companyAddress: Address;

    // map options
    options = {
        layers: [
            L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom: 18}),
        ],
        zoom: 5,
        center: L.latLng(39.4078968, -0.4317229)
    };
    // marker icon
    markerIcon = {
        icon: L.icon({
            iconSize: [25, 41],
            iconAnchor: [10, 41],
            popupAnchor: [2, -40],
            // specify the path here
            iconUrl: 'https://unpkg.com/leaflet@1.5.1/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.5.1/dist/images/marker-shadow.png'
        })
    };

    // map
    map: L.Map;

    constructor(public router: Router,
                public translateService: TranslateService,
                private zone: NgZone,
                public userService: UserService) {
    }

    onMapReady(map: L.Map): void {
        // set the map
        this.map = map;
        if(this.searchResults && this.searchResults.length > 0){
            // mark the location of each company on the map
            this.searchResults.forEach(searchResult => {
                let company = searchResult.manufacturer ? searchResult.manufacturer :searchResult;
                if (company.locationLatitude !== null && company.locationLongitude !== null) {
                    // create marker
                    const m = L.marker([company.locationLatitude, company.locationLongitude], this.markerIcon);
                    m.bindPopup(this.getPopupContent(company, m));
                    m.on('mouseover', function (e) {
                        this.openPopup();
                    });
                    m.on('mouseout', function (e) {
                        this.closePopup();
                    });
                    m.addEventListener('click', evt => {
                        // Make changes inside Angular's zone using the run() function, otherwise, it does not detect the navigation
                        // for more information, refer to https://github.com/Asymmetrik/ngx-leaflet#a-note-about-change-detection
                        this.zone.run(() => {
                            this.router.navigate(['/user-mgmt/company-details'], {queryParams: {id: company.id}});
                        });
                    });
                    m.addTo(this.map);
                }
            });
        }
    }


    /**
     * Returns the marker popup content including the company name and the distance between the location of active company and the company marker
     * */
    private getPopupContent(partySearchResult: any, marker): string {
        // company name
        let content: string = selectNameFromLabelObject(partySearchResult.brandName);
        if (!content) {
            content = partySearchResult.legalName;
        }
        // distance
        if (this.companyAddress.locationLatitude !== null && this.companyAddress.locationLongitude !== null) {
            const companyMarker = L.marker([this.companyAddress.locationLatitude, this.companyAddress.locationLongitude]);
            content += '<br>' + this.translateService.instant('Distance') + ': ' + (companyMarker._latlng.distanceTo(marker._latlng)).toFixed(0) / 1000 + ' km';
        }

        return content;
    }
}
