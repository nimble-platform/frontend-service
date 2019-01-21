import {Component, OnInit, Input, Output, EventEmitter} from "@angular/core";
import { Router } from "@angular/router";
import { BPDataService } from "../bpe/bp-view/bp-data-service";
import { ProcessInstanceGroup } from "../bpe/model/process-instance-group";
import { ThreadEventMetadata } from "../catalogue/model/publish/thread-event-metadata";
import {BPEService} from "../bpe/bpe.service";
import {BpStartEvent} from '../catalogue/model/publish/bp-start-event';
import {BpUserRole} from '../bpe/model/bp-user-role';
import {BpURLParams} from '../catalogue/model/publish/bpURLParams';

@Component({
    selector: "thread-event",
    templateUrl: "./thread-event.component.html",
    styleUrls: ["./thread-event.component.css"]
})
export class ThreadEventComponent implements OnInit {

    @Input() processInstanceGroup: ProcessInstanceGroup;
    @Input() collaborationGroupId: string;
    @Input() event: ThreadEventMetadata;
    @Output() processCancelled = new EventEmitter();

    constructor(private bpDataService: BPDataService,
                private bpeService: BPEService) {
    }

    ngOnInit() {

    }

    async openBpProcessView(updateProcess:boolean) {
        // whether we are updating the process instance or not
        this.event.isBeingUpdated = updateProcess;
        let userRole:BpUserRole = this.event.buyer ? "buyer": "seller";
        this.bpDataService.startBp(new BpStartEvent(userRole,this.event.processType,this.processInstanceGroup.id,this.collaborationGroupId,this.event),true,new BpURLParams(this.event.product.catalogueDocumentReference.id,this.event.product.manufacturersItemIdentification.id,this.event.processId));
    }

    cancelBP(){
        if (confirm("Are you sure that you want to cancel this process?")){
            this.bpeService.cancelBusinessProcess(this.event.processId)
                .then(res => {
                    this.processCancelled.next();
                })
                .catch(error => {
                    console.error(error);
                });
        }
    }
}