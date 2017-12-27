import {Component, Input, OnInit} from "@angular/core";
import {BPEService} from "../../bpe.service";
import {UserService} from "../../../user-mgmt/user.service";
import {CookieService} from "ng2-cookies";
import {BPDataService} from "../bp-data-service";
import * as myGlobals from '../../../globals';
import {CustomerParty} from "../../../catalogue/model/publish/customer-party";
import {SupplierParty} from "../../../catalogue/model/publish/supplier-party";
import {UBLModelUtils} from "../../../catalogue/model/ubl-model-utils";
import {ProcessVariables} from "../../model/process-variables";
import {ModelUtils} from "../../model/model-utils";
import {ProcessInstanceInputMessage} from "../../model/process-instance-input-message";
import {Ppap} from "../../../catalogue/model/publish/ppap";
import {CallStatus} from "../../../common/call-status";
import {ActivatedRoute, Router} from "@angular/router";

@Component({
    selector: 'ppap',
    templateUrl: './ppap.component.html'
})

export class PpapComponent implements OnInit{

    selectedTab: string;

    callStatus:CallStatus = new CallStatus();
    error_detc: boolean;
    callback: boolean;

    level: any = -1;
    note: any;
    ppap: Ppap;
    seller: boolean = false;

    documents: {text: String, select: boolean}[] = [];

    constructor(private bpeService: BPEService,
                private bpDataService: BPDataService,
                private userService: UserService,
                private cookieService: CookieService,
                public route: ActivatedRoute,
                private router:Router) {
    }

    ngOnInit() {

        this.bpDataService.initPpap([]);
        this.ppap = this.bpDataService.ppap;

        let currentCompanyId:string = this.cookieService.get("company_id");
        let sellerId:string = this.bpDataService.catalogueLine.goodsItem.item.manufacturerParty.id;

        // checks whether a PPAP process is started or not
        let pidExists = true;

        this.route.queryParams.subscribe(params =>{
            let check = params['pid'];
            if(check == null){
                this.selectedTab= "Ppap Select";
                pidExists = false;
            }
        });
        if(pidExists){
            // seller
            if(currentCompanyId == sellerId){
                this.seller = true;
                if(this.bpDataService.ppapResponse && this.bpDataService.ppapResponse.requestedDocument != null){
                    this.selectedTab = "Ppap Download";
                }
                else{
                    this.selectedTab = "Ppap Upload";
                }
            }
            // buyer
            else{
                if(!this.bpDataService.ppapResponse){
                    this.selectedTab = "Ppap Select";
                }
                else{
                    this.selectedTab = "Ppap Download";
                }
            }
        }

    }

}
