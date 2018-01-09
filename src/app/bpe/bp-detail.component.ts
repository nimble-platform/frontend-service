import 'rxjs/add/operator/switchMap';
import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, ParamMap} from '@angular/router';
import {Location} from '@angular/common';

import {BP} from './model/bp';
import {BPService} from './bp.service';

import {ExternalDiagram} from './lib/external-diagram';

@Component({
    selector: 'bp-detail',
    templateUrl: './bp-detail.component.html'
})
export class BPDetailComponent implements OnInit {
    bp: BP;
    diagram: ExternalDiagram;
    isCreatePage: boolean;

    constructor(private bpService: BPService,
                private route: ActivatedRoute,
                private location: Location) {
        this.isCreatePage = this.location.isCurrentPathEqualTo('/bpe/bpe-design/create');
        if (this.isCreatePage) {
            this.bp = new BP('', '', '', '', '', []);
        }
    }

    ngOnInit(): void {
        if (!this.isCreatePage) {
            this.route.paramMap
                .switchMap((params: ParamMap) => this.bpService.getBP(params.get('processID')))
                .subscribe(bp => this.bp = bp);
        }
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.diagram = new ExternalDiagram();
            this.diagram.draw_editable_diagram();
        }, 500);
    }

    create(): void {
        this.bpService.create(this.bp)
            .subscribe(() => this.goBack());
    }

    update(): void {
        this.bpService.update(this.bp)
            .subscribe(() => this.goBack());
    }

    goBack(): void {
        this.location.back();
    }
}
