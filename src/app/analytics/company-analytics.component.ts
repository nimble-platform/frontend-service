import {Component, OnInit} from '@angular/core';
import {AnalyticsService} from "./analytics.service";

@Component({
    selector: 'company-analytics',
    templateUrl: './company-analytics.component.html',
    styleUrls: ['./company-analytics.component.css']
})

export class CompanyAnalyticsComponent implements OnInit {

    
    constructor(
        private analyticsService: AnalyticsService
    ) {
    }

    ngOnInit(): void {
        
    }

}
