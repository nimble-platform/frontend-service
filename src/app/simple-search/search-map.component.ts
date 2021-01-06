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

import {Component, EventEmitter, Input, Output} from '@angular/core';
import * as L from 'leaflet';
import 'style-loader!leaflet/dist/leaflet.css';
import {Router} from '@angular/router';
import {selectNameFromLabelObject} from '../common/utils';

@Component({
    selector: 'search-map',
    templateUrl: './search-map.component.html'
})

export class SearchMapComponent {

    // search results could be either product search results or company search results. They are differentiated by checking the
    // manufacturer field of a result
    @Input() searchResults: any[];
    @Output() companyResultClicked: EventEmitter<any> = new EventEmitter<any>();
    @Output() productResultClicked: EventEmitter<any> = new EventEmitter<any>();

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
        if (this.searchResults && this.searchResults.length > 0) {
            // product results
            if (this.searchResults[0].manufacturer) {
                this.searchResults.forEach(product => {
                    // TODO check search result
                    if (product.manufacturer.coordinate) {
                        const m = L.marker([product.manufacturer.coordinate.longitude, product.manufacturer.coordinate.latitude], {icon: icon});
                        m.bindPopup(this.getPopupContentForProduct(product));
                        m.on('mouseover', function (e) {
                            this.openPopup();
                        });
                        m.on('mouseout', function (e) {
                            this.closePopup();
                        });
                        m.on('click', (e) => {
                            this.productResultClicked.emit(product);
                        });
                        m.addTo(this.map);
                    }
                });

                // company results
            } else {
                this.searchResults.forEach(company => {
                    // TODO check search result
                    if (company.coordinate) {
                        const m = L.marker([company.coordinate.longitude, company.coordinate.latitude], {icon: icon});
                        m.bindPopup(this.getPopupContentForParty(company));
                        m.on('mouseover', function (e) {
                            this.openPopup();
                        });
                        m.on('mouseout', function (e) {
                            this.closePopup();
                        });
                        m.on('click', (e) => {
                            this.productResultClicked.emit(company);
                        });
                        m.addTo(this.map);
                    }
                });
            }

        } else {

        }
    }

    private getPopupContentForParty(partySearchResult: any): string {
        let name: string = selectNameFromLabelObject(partySearchResult.brandName);
        if (!name) {
            name = partySearchResult.legalName;
        }
        return name;
    }

    private getPopupContentForProduct(productSearchResult: any): string {
        let content: string = selectNameFromLabelObject(productSearchResult.label);
        content += '<br>'
        content += this.getPopupContentForParty(productSearchResult.manufacturer);
        return content;
    }
}
