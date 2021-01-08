/*
 * Copyright 2020
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
   In collaboration with
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

import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import * as L from 'leaflet';
import 'style-loader!leaflet/dist/leaflet.css';
import {Coordinate} from '../catalogue/model/publish/coordinate';
import {AddressMapService} from './address-map.service';
import {Subject} from 'rxjs';
import 'rxjs/add/operator/takeUntil';

@Component({
    selector: 'address-map',
    templateUrl: './address-map.component.html'
})
export class AddressMapComponent implements OnInit, OnDestroy {

    @Input() coordinate: Coordinate;
    @Input() disabled: boolean = false;
    @Output() coordinateChange = new EventEmitter<Coordinate>();

    ngUnsubscribe: Subject<void> = new Subject<void>();
    // marker representing the company address
    marker = null;

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

    constructor(public addressMapService: AddressMapService) {
    }

    ngOnInit(): void {
        // when the address map size is changed, invalidate the map size so that it sets the map dimensions properly
        this.addressMapService.addressMapSizeChanged.takeUntil(this.ngUnsubscribe).subscribe(() => {
            setTimeout(() => {
                this.map.invalidateSize();
            }, 200)
        })
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    onMapReady(map: L.Map): void {
        // set map
        this.map = map;
        // mark the company location on the map if available
        if (this.coordinate.longitude !== null && this.coordinate.latitude !== null) {
            this.marker = L.marker([this.coordinate.latitude, this.coordinate.longitude], this.markerIcon);
            this.marker.on('mouseover', function (e) {
                this.openPopup();
            });
            this.marker.on('mouseout', function (e) {
                this.closePopup();
            });
            this.marker.addTo(this.map);
        }
        // if the map is not disabled, handle the click events on map
        if (!this.disabled) {
            this.map.on('click', e => {
                // remove the existing marker
                if (this.marker) {
                    this.map.removeLayer(this.marker);
                }
                // create new marker
                this.marker = new L.marker([e.latlng.lat, e.latlng.lng], this.markerIcon).addTo(this.map);
                // emit the change on coordinate
                this.coordinateChange.emit(new Coordinate(e.latlng.lng, e.latlng.lat));
            });
        }

    }
}
