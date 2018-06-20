import { Component, OnInit, Input } from "@angular/core";
import { Router } from "@angular/router";
import { ThreadEventMetadata } from "./model/thread-event-metadata";
import { BPDataService } from "../bpe/bp-view/bp-data-service";
import { ActivityVariableParser } from "../bpe/bp-view/activity-variable-parser";
import { ProcessInstanceGroup } from "../bpe/model/process-instance-group";

@Component({
    selector: "thread-event",
    templateUrl: "./thread-event.component.html",
    styleUrls: ["./thread-event.component.css"]
})
export class ThreadEventComponent implements OnInit {

    @Input() processInstanceGroup: ProcessInstanceGroup;
    @Input() event: ThreadEventMetadata;

    constructor(private bpDataService: BPDataService,
                private router: Router) {
    }

    ngOnInit() {

    }

    openBpProcessView() {
        let role = ActivityVariableParser.getUserRole(this.event.activityVariables,this.processInstanceGroup.partyID);
        this.bpDataService.setBpOptionParametersWithProcessMetadata(role, this.event.processType, this.event);
        this.bpDataService.setRelatedGroupId(this.processInstanceGroup.id);
        this.router.navigate(['bpe/bpe-exec'], {
            queryParams: {
                catalogueId: this.event.product.catalogueDocumentReference.id,
                id: this.event.product.manufacturersItemIdentification.id,
                pid: this.event.processId
            }
        });
    }
}