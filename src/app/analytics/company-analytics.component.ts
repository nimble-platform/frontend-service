import {Component, OnInit} from '@angular/core';
import {AnalyticsService} from "./analytics.service";
import {TranslateService} from '@ngx-translate/core';

@Component({
    selector: 'company-analytics',
    templateUrl: './company-analytics.component.html',
    styleUrls: ['./company-analytics.component.css']
})

export class CompanyAnalyticsComponent implements OnInit {

    
    constructor(
        private analyticsService: AnalyticsService,
        private translate: TranslateService,
    ) {
        translate.setDefaultLang("en");
        translate.use(translate.getBrowserLang());
    }

    ngOnInit(): void {
        
    }

}
