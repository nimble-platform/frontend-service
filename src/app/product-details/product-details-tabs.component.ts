import { Component, Input, OnInit } from "@angular/core";
import { ProductDetailsTab } from "./model/product-details-tab";
import { ProductWrapper } from "../common/product-wrapper";
import { BpWorkflowOptions } from "../bpe/model/bp-workflow-options";
import { BPEService } from "../bpe/bpe.service";
import { ItemProperty } from "../catalogue/model/publish/item-property";
import { getPropertyValuesAsStrings, selectPartyName } from "../common/utils";
import { CompanySettings } from "../user-mgmt/model/company-settings";
import * as myGlobals from '../globals';
import {Quantity} from '../catalogue/model/publish/quantity';

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
    @Input() tabToOpen: string = "";
    config = myGlobals.config;

    selectedTab: ProductDetailsTab;

    isLogistics: boolean = false;
    isTransportService: boolean = false;

    haveDetails = true;
    haveTransportServiceDetails = true;
    haveCertificates = true;
    haveLCPA = true;
    havePrice = true;
    haveRating = false;

    constructor(
        private bpeService: BPEService,
    ) {}

    ngOnInit() {
        this.selectedTab = this.showOverview? "OVERVIEW" : "DETAILS";
        this.isLogistics = this.wrapper.getLogisticsStatus();
        this.isTransportService = this.wrapper.isTransportService();
        if(this.wrapper.getDimensions().length == 0 && this.wrapper.getUniquePropertiesWithValue().length == 0){
            this.haveDetails = false;
            this.selectedTab = this.getFirstTab();
        }
        if(!this.isLogistics) {
          if (this.wrapper.getIncoterms() == '' && this.wrapper.getSpecialTerms() == null && this.wrapper.getDeliveryPeriod() == '' && this.wrapper.getPackaging() == '') {
            this.haveTransportServiceDetails = false;
            this.selectedTab = this.getFirstTab();
          }
        }
        else if (this.isTransportService){
          if(this.wrapper.line.goodsItem.item.transportationServiceDetails.transportServiceCode.name == "" &&
            this.wrapper.line.goodsItem.item.transportationServiceDetails.supportedCommodityClassification[0].natureCode.name == "" &&
            this.wrapper.line.goodsItem.item.transportationServiceDetails.supportedCommodityClassification[0].cargoTypeCode.name == "" &&
            this.wrapper.line.goodsItem.item.transportationServiceDetails.totalCapacityDimension.measure.value == null &&
            this.wrapper.line.goodsItem.item.transportationServiceDetails.estimatedDurationPeriod.durationMeasure.value == null &&
            this.wrapper.line.goodsItem.item.transportationServiceDetails.scheduledServiceFrequency[0].weekDayCode.name == "" &&
            this.wrapper.line.goodsItem.item.transportationServiceDetails.shipmentStage[0].transportModeCode.name == "" &&
            selectPartyName(this.wrapper.line.goodsItem.item.transportationServiceDetails.shipmentStage[0].carrierParty.partyName) == null &&
            (this.wrapper.line.requiredItemLocationQuantity.applicableTerritoryAddress == null || this.wrapper.line.requiredItemLocationQuantity.applicableTerritoryAddress == [] || this.wrapper.line.requiredItemLocationQuantity.applicableTerritoryAddress == undefined) &&
            this.wrapper.line.goodsItem.item.transportationServiceDetails.shipmentStage[0].transportMeans.transportMeansTypeCode.name == "" &&
            this.wrapper.line.goodsItem.item.transportationServiceDetails.shipmentStage[0].transportMeans.transportEquipment[0].humidityPercent == null &&
            this.wrapper.line.goodsItem.item.transportationServiceDetails.shipmentStage[0].transportMeans.transportEquipment[0].refrigeratedIndicator == null &&
            this.wrapper.line.goodsItem.item.transportationServiceDetails.shipmentStage[0].transportMeans.transportEquipment[0].characteristics == null &&
            this.wrapper.line.goodsItem.item.transportationServiceDetails.shipmentStage[0].transportMeans.transportEquipment[0].transportEquipmentTypeCode.name == "" &&
            this.wrapper.line.goodsItem.item.transportationServiceDetails.environmentalEmission[0].environmentalEmissionTypeCode.name == "" &&
            this.wrapper.line.goodsItem.item.transportationServiceDetails.environmentalEmission[0].valueMeasure.value == null) {
              this.haveTransportServiceDetails = false;
              this.selectedTab = this.getFirstTab();
            }
        }

        if(this.wrapper.getPricePerItem() == '' && this.wrapper.getFreeSample() == ''){
          this.havePrice = false;
          this.selectedTab = this.getFirstTab();
        }

        if(this.settings.certificates.length == 0 && this.wrapper.line.goodsItem.item.certificate.length == 0){
            this.haveCertificates = false;
            this.selectedTab = this.getFirstTab();
        }
        if(this.wrapper.line.goodsItem.item.lifeCyclePerformanceAssessmentDetails == null){
            this.haveLCPA = false;
            this.selectedTab = this.getFirstTab();
        }

        if(this.tabToOpen == "rating"){
          this.selectedTab = "RATING";
        }

        this.bpeService.getRatingsSummary(this.settings.companyID).then(ratings => {
            if (ratings.totalNumberOfRatings <= 0) {
                this.haveRating = false;
                this.selectedTab = this.getFirstTab();
            }
            else {
              this.haveRating = true;
            }

            if(this.tabToOpen == "rating"){
              this.selectedTab = "RATING";
            }

          })
          .catch(error => {
            this.haveRating = false;
            this.selectedTab = this.getFirstTab();
          });
        
    }

    onSelectTab(event: any): void {
        event.preventDefault();
        this.selectedTab = event.target.id;
    }

    getValuesAsString(property: ItemProperty): string[] {
        return getPropertyValuesAsStrings(property);
    }

    getMultiValuedDimensionAsString(quantities:Quantity[]){
        let quantitiesWithUnits = quantities.filter(qty => qty.unitCode && qty.unitCode != '');
        return quantitiesWithUnits.map(qty => `${qty.value} ${qty.unitCode}`).join(", ");
    }

    getHumanReadablePropertyName(propertyName:string): string{
        return propertyName.replace("Has", "");
    }

    getTransportStatusTab(data){
        if(data){
            this.haveTransportServiceDetails = false;
            if (this.selectedTab == "DELIVERY_TRADING")
              this.selectedTab = this.getFirstTab();
        }
    }

    getCertificateStatusTab(data){
        if(data){
            this.haveCertificates = false;
            if (this.selectedTab == "CERTIFICATES")
              this.selectedTab = this.getFirstTab();
        }
    }

    getLCPAStatusTab(data){
        if(data){
            this.haveLCPA = false;
            if (this.selectedTab == "LCPA")
              this.selectedTab = this.getFirstTab();
        }
    }

    getRatingStatusTab(data){
        if(data){
            this.haveRating = false;
            if (this.selectedTab == "RATING")
              this.selectedTab = this.getFirstTab();
        }
    }

    getFirstTab(): ProductDetailsTab {
      if (this.showOverview) {
        return "OVERVIEW";
      }
      else {
        if (this.haveDetails)
          return "DETAILS";
        else if (this.havePrice)
          return "PRICE";
        else if (this.haveTransportServiceDetails)
          return "DELIVERY_TRADING";
        else if (this.haveCertificates)
          return "CERTIFICATES";
        else if (this.config.showLCPA && this.haveLCPA)
          return "LCPA";
        else
          return "COMPANY";
      }
    }
}
