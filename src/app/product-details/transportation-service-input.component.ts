import { Component, OnInit, Input , EventEmitter, Output} from "@angular/core";
import { CatalogueLine } from "../catalogue/model/publish/catalogue-line";
import { TransportationService } from "../catalogue/model/publish/transportation-service";
import {selectPartyName} from '../common/utils';
import { Address } from "../user-mgmt/model/address";
import { DetailedAddressViewComponent } from "../catalogue/ubl-model-view/detailed-address-view.component";

@Component({
    selector: "transportation-service-input",
    templateUrl: "./transportation-service-input.component.html"
})
export class TransportationServiceInput implements OnInit {

    @Input() catalogueLine: CatalogueLine;
    @Input() presentationMode: "edit" | "view" = "edit";
    @Output() transportStatus = new EventEmitter<boolean>();

    spacingClass: string = "";
    valueTextClass: string = "";
    titleClass: string = "";
    shipmentStage:boolean = true;
    haveCountries:boolean = false;
    haveTransportMeans: boolean = true;
    haveEnvironmentalEmission : boolean = true;
    haveTransporationServiceDetails : boolean = true;
    address:any;
    constructor() {
    }

    ngOnInit() {
      if(this.catalogueLine.goodsItem.item.transportationServiceDetails == null) {
        this.catalogueLine.goodsItem.item.transportationServiceDetails = new TransportationService();
      }


      if(this.catalogueLine.goodsItem.item.transportationServiceDetails.transportServiceCode.name == "" &&
        this.catalogueLine.goodsItem.item.transportationServiceDetails.supportedCommodityClassification[0].natureCode.name == "" &&
        this.catalogueLine.goodsItem.item.transportationServiceDetails.supportedCommodityClassification[0].cargoTypeCode.name == "" &&
        this.catalogueLine.goodsItem.item.transportationServiceDetails.totalCapacityDimension.measure.value == null &&
        this.catalogueLine.goodsItem.item.transportationServiceDetails.estimatedDurationPeriod.durationMeasure.value == null &&
        this.catalogueLine.goodsItem.item.transportationServiceDetails.scheduledServiceFrequency[0].weekDayCode.name == ""){
          this.haveTransporationServiceDetails = false;
      }

      if(this.catalogueLine.goodsItem.item.transportationServiceDetails.shipmentStage[0].transportModeCode.name == "" &&
        selectPartyName(this.catalogueLine.goodsItem.item.transportationServiceDetails.shipmentStage[0].carrierParty.partyName) == null){
          this.shipmentStage = false;
      }

      if(this.catalogueLine.requiredItemLocationQuantity.applicableTerritoryAddress == null ||
         this.catalogueLine.requiredItemLocationQuantity.applicableTerritoryAddress == [] ||
         this.catalogueLine.requiredItemLocationQuantity.applicableTerritoryAddress == undefined){
         this.haveCountries = false;
      }else{
        for(this.address in this.catalogueLine.requiredItemLocationQuantity.applicableTerritoryAddress){
            if(this.catalogueLine.requiredItemLocationQuantity.applicableTerritoryAddress[this.address].country.name.value !== null){
              this.haveCountries = true;
            }
        }
      }

      if(this.catalogueLine.goodsItem.item.transportationServiceDetails.shipmentStage[0].transportMeans.transportMeansTypeCode.name == "" &&
        this.catalogueLine.goodsItem.item.transportationServiceDetails.shipmentStage[0].transportMeans.transportEquipment[0].humidityPercent == null &&
        this.catalogueLine.goodsItem.item.transportationServiceDetails.shipmentStage[0].transportMeans.transportEquipment[0].refrigeratedIndicator == null &&
        this.catalogueLine.goodsItem.item.transportationServiceDetails.shipmentStage[0].transportMeans.transportEquipment[0].characteristics == null &&
        this.catalogueLine.goodsItem.item.transportationServiceDetails.shipmentStage[0].transportMeans.transportEquipment[0].transportEquipmentTypeCode.name == ""){
          this.haveTransportMeans = false;
      }

      if(this.catalogueLine.goodsItem.item.transportationServiceDetails.environmentalEmission[0].environmentalEmissionTypeCode.name == "" &&
      this.catalogueLine.goodsItem.item.transportationServiceDetails.environmentalEmission[0].valueMeasure.value == null){
        this.haveEnvironmentalEmission = false;
      }

      if(this.haveCountries == false && this.haveEnvironmentalEmission == false && this.haveTransporationServiceDetails == false && this.haveTransportMeans ==false && this.shipmentStage ==false){
        this.transportStatus.emit(true);
      }

      if(this.presentationMode === "edit") {
        this.spacingClass = "my-3";
        this.valueTextClass = "form-control-sm";
        this.titleClass = "my-2";
      } else {
        this.valueTextClass = "form-control-sm m-0 p-0";
        this.titleClass = "my-3";
      }
    }
}
