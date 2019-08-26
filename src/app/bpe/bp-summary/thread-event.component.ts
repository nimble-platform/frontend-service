import {Component, OnInit, Input, Output, EventEmitter} from "@angular/core";
import { Router } from "@angular/router";
import { BPDataService } from "../bp-view/bp-data-service";
import { ProcessInstanceGroup } from "../model/process-instance-group";
import { ThreadEventMetadata } from "../../catalogue/model/publish/thread-event-metadata";
import {BPEService} from "../bpe.service";
import {BpActivityEvent} from '../../catalogue/model/publish/bp-start-event';
import {BpUserRole} from '../model/bp-user-role';
import {BpURLParams} from '../../catalogue/model/publish/bpURLParams';
import {TranslateService} from '@ngx-translate/core';
import {ActivityVariableParser} from '../bp-view/activity-variable-parser';

@Component({
    selector: "thread-event",
    templateUrl: "./thread-event.component.html",
    styleUrls: ["./thread-event.component.css"]
})
export class ThreadEventComponent implements OnInit {

    @Input() processInstanceGroup: ProcessInstanceGroup;
    @Input() collaborationGroupId: string;
    @Input() event: ThreadEventMetadata;
    @Input() history: ThreadEventMetadata[] = [];
    @Output() processCancelled = new EventEmitter();

    constructor(private bpDataService: BPDataService,
                private bpeService: BPEService,
                private translate: TranslateService) {
        translate.setDefaultLang("en");
        translate.use(translate.getBrowserLang());
    }

    ngOnInit() {

    }

    async openBpProcessView(updateProcess:boolean) {
        // whether we are updating the process instance or not
        this.event.isBeingUpdated = updateProcess;
        let userRole:BpUserRole = this.event.buyer ? "buyer": "seller";
        this.bpDataService.startBp(
            new BpActivityEvent(
                userRole,
                this.event.processType,
                this.processInstanceGroup.id,
                this.collaborationGroupId,
                this.event,
                this.history,
                null,
                false,
                this.event.formerStep),
            true,
            new BpURLParams(
                this.event.product.catalogueDocumentReference.id,
                this.event.product.manufacturersItemIdentification.id,
                this.event.processInstanceId,
                ActivityVariableParser.getPrecedingDocumentId(this.event.activityVariables)));
    }

    cancelBP(){
        if (confirm("Are you sure that you want to cancel this process?")){
            this.bpeService.cancelBusinessProcess(this.event.processInstanceId)
                .then(res => {
                    this.processCancelled.next();
                })
                .catch(error => {
                    console.error(error);
                });
        }
    }
}