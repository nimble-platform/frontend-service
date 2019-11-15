import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, RouterStateSnapshot} from '@angular/router';

@Component({
    selector: 'simple-search',
    templateUrl: './simple-search.component.html'
})

export class SimpleSearchComponent implements OnInit {

    pageRef = '';

    constructor (private route: ActivatedRoute) {}

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            this.pageRef = params['pageRef'];
        });
    }

    canDeactivate(nextState: RouterStateSnapshot): boolean {
        if (this.pageRef === 'publish' && !nextState.url.startsWith('/catalogue/publish')) {
            if (!confirm('You will lose any changes you made, are you sure you want to quit ?')) {
                return false;
            }
        }
        return true;
    }
}
