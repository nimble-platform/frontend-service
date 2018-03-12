import {Component, Input, OnInit} from "@angular/core";
import {ProcessInstanceGroup} from "../bpe/model/process-instance-group";
import {ProcessInstance} from "../bpe/model/process-instance";
import {Router} from "@angular/router";
/**
 * Created by suat on 12-Mar-18.
 */
@Component({
    selector: 'thread-summary',
    templateUrl: './thread-summary-component.html'
})

export class ThreadSummaryComponent implements OnInit {

    @Input() processInstanceGroup: ProcessInstanceGroup;
    processInstances: ProcessInstance[];
    additionalProcessMetadata: any;

    constructor(private router: Router) {
    }

    ngOnInit(): void {
        this.getProcessInstanceDetails();
    }

    getProcessInstanceDetails(): void {
        //TODO
        setTimeout(0, () => {
            this.processInstances = [];
            let pi1:ProcessInstance = new ProcessInstance("pi1", "Item_Information_Request", "2018-01-01 15:00:00", "Completed");
            let pi2:ProcessInstance = new ProcessInstance("pi2", "Negotiation", "2018-02-01 15:00:00", "Completed");
            this.processInstances.push(pi1, pi2);
        });
    }

    navigateToSearchDetails(productId:string) {
        this.router.navigate(['/simple-search/details'],
            { queryParams: {
                pid: productId,
                showOptions: true
            }});
    }
}