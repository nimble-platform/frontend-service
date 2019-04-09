import { Component, Input, OnInit } from "@angular/core";
import { ProductDetailsTab } from "./model/product-details-tab";
import { ProductWrapper } from "../common/product-wrapper";
import { BpWorkflowOptions } from "../bpe/model/bp-workflow-options";
import { BPEService } from "../bpe/bpe.service";
import { ItemProperty } from "../catalogue/model/publish/item-property";
import { getPropertyValuesAsStrings } from "../common/utils";
import { CompanySettings } from "../user-mgmt/model/company-settings";
import * as myGlobals from '../globals';
import { CallStatus } from "../common/call-status";

@Component({
    selector: 'product-details-tabs',
    templateUrl: './product-details-tabs.component.html',
    styleUrls: ['./product-details-tabs.component.css']
})
export class ProductDetailsTabsComponent implements OnInit {

    @Input() wrapper: ProductWrapper;
    @Input() options: BpWorkflowOptions;
    @Input() settings: CompanySettings;

    @Input() showOverview: boolean = false;
    @Input() readonly: boolean = false;
    config = myGlobals.config;

    selectedTab: ProductDetailsTab;

    isLogistics: boolean = false;
    haveDatails: boolean = true;
    haveTransportServiceDetails = true;
    haveCertificates = true;
    haveLcps = true;
    haveRating = true;

    initCallStatus: CallStatus = new CallStatus();

    constructor(
        private bpeService: BPEService,
    ) {}

    ngOnInit() {
        this.selectedTab = this.showOverview ? "OVERVIEW" : "DETAILS";
        this.isLogistics = this.wrapper.getLogisticsStatus();        
        if(this.wrapper.getDimensions().length == 0 && this.wrapper.getUniquePropertiesWithValue().length == 0){
            this.selectedTab = "DELIVERY_TRADING";
            this.haveDatails = false;
        }
        if(this.settings.certificates.length == 0 && this.wrapper.line.goodsItem.item.certificate.length == 0){
            this.haveCertificates = false;
        }   
        if(this.wrapper.line.goodsItem.item.lifeCyclePerformanceAssessmentDetails == null){
            this.haveLcps = false;
        }
        this.bpeService.getRatingsSummary(this.settings.companyID).then(ratings => {
            this.initCallStatus.submit();
            if (ratings.totalNumberOfRatings <= 0) {
                this.haveRating = false;
            }
            this.initCallStatus.callback("Ratings successfully fetched", true);
          })
          .catch(error => {
            this.initCallStatus.error("Error while fetching company ratings", error);
          });
    }

    onSelectTab(event: any): void {
        event.preventDefault();
        this.selectedTab = event.target.id;
    }

    getValuesAsString(property: ItemProperty): string[] {
        return getPropertyValuesAsStrings(property);
    }

    getHumanReadablePropertyName(propertyName:string): string{
        return propertyName.replace("Has", "");
    }

    getStatusOfTansportTab(data){
        if(data){
            this.selectedTab = "CERTIFICATES";
            this.haveTransportServiceDetails = false;
        }
    }

    getTrustStatusTab(data){
        if(data){
            this.selectedTab = "LCPA";
            this.haveCertificates = false;
        }
    }

    getlcpaStatusTab(data){
        if(data){
            this.selectedTab = "COMPANY";
            this.haveLcps = false;
        }
    }

    getRatingStatus(data){
        if(data){
            this.haveRating = false;
        }
    }
}