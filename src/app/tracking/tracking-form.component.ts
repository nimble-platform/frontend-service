import { Component } from '@angular/core';
import { Search } from './model/search';
import {TrackingService} from './tracking.service';

@Component({
    selector: 'tracking-form',
    templateUrl: './tracking-form.component.html',
    styleUrls: ['./tracking-form.component.css'],
    providers: [TrackingService]
})

export class TrackingFormComponent {
    public model = new Search('');
    public metaData = {};

    constructor(private tntBackend: TrackingService) {}

    Search(code: string) {
        console.log(code);
        this.tntBackend.getMetaData(code)
            .then(resp => {
                this.metaData = resp;
            });
    }

}
