import {Component, Input, OnInit} from '@angular/core';
import { CookieService } from "ng2-cookies";
import { BPDataService } from "../bp-data-service";
import { ActivatedRoute } from "@angular/router";
import { BpUserRole } from "../../model/bp-user-role";
import {UBLModelUtils} from '../../../catalogue/model/ubl-model-utils';

@Component({
    selector: "ppap",
    templateUrl: "./ppap.component.html"
})
export class PpapComponent implements OnInit {

    screen: "select" | "upload" | "download";
    userRole: BpUserRole;

    // whether the item is deleted or not
    @Input() isCatalogueLineDeleted:boolean = false ;

    constructor(private bpDataService: BPDataService,
                private cookieService: CookieService,
                public route: ActivatedRoute) {
    }

    ngOnInit() {
        if(!this.bpDataService.ppap) {
            this.bpDataService.initPpap([]);
        }

        const currentCompanyId: string = this.cookieService.get("company_id");
        const sellerId: string = UBLModelUtils.getPartyId(this.bpDataService.getCatalogueLine().goodsItem.item.manufacturerParty);

        this.route.params.subscribe(params => {
            if (params['processInstanceId'] === 'new') {
                this.screen = "select";
                this.userRole = "buyer";
            } else if (currentCompanyId === sellerId) {
                // seller
                this.userRole = "seller";
                if (this.bpDataService.ppapResponse && this.bpDataService.ppapResponse.requestedDocument) {
                    this.screen = "download";
                } else {
                    let isCollaborationCancelled = this.bpDataService.bpActivityEvent.processMetadata && this.bpDataService.bpActivityEvent.processMetadata.collaborationStatus == "CANCELLED";
                    this.screen = isCollaborationCancelled ? "select" : "upload";
                }
            } else {
                // buyer
                this.userRole = "buyer";
                if (!this.bpDataService.ppapResponse ) {
                    this.screen = "select";
                } else {
                    this.screen = "download";
                }
            }
        });
    }

}
