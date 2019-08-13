import { Component } from '@angular/core';
import { FiltersService } from './filters.service';

@Component({
    selector: 'filters',
    templateUrl: './filters.component.html',
    styleUrls: ['./filters.component.css'],
    providers: [ FiltersService ]
})

export class FiltersComponent {}
