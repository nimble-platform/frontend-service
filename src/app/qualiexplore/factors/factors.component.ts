import { Component } from '@angular/core';
import { FactorsService } from './factors.service';

@Component({
    selector: 'factors',
    templateUrl: './factors.component.html',
    styleUrls: ['./factors.component.css'],
    providers: [ FactorsService ]
})

export class FactorsComponent {}
