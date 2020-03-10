import { Component, OnInit, Input,EventEmitter, Output } from "@angular/core";
import { BPEService } from "../bpe/bpe.service";
import { ActivatedRoute} from "@angular/router";
import { CookieService } from "ng2-cookies";
import * as myGlobals from "../globals";
import { CallStatus } from "../common/call-status";
import {TranslateService} from '@ngx-translate/core';
import {UserService} from '../user-mgmt/user.service';
import {FEDERATIONID} from '../catalogue/model/constants';


@Component({
    selector: "company-rating",
    templateUrl: "./company-rating.component.html",
    styleUrls: ['./company-rating.component.css']
})
export class CompanyRatingComponent implements OnInit {

	@Input() id: any = null;
	@Input() federationId:string = null;
  @Input() hideTitle: boolean = false;
  @Output() ratingStatus = new EventEmitter<boolean>();

    initCallStatus: CallStatus = new CallStatus();
    ratings: any = null;
    ratingDetails: any = null;
    ratingOverall = 0;
    ratingSeller = 0;
    ratingFulfillment = 0;


    negotiationQuality = false;
    orderQuality = false;
    responsetime= false;
    prodListingAccu = false;
    conformToOtherAggre = false;
    deliveryPackage = false;
    sellerNegoSettings = null;


    constructor(private cookieService: CookieService,
                private bpeService: BPEService,
                private translate: TranslateService,
                private userService: UserService,
                public route: ActivatedRoute) {
    }

    ngOnInit() {
  		if(!this.id) {
  			this.route.queryParams.subscribe(params => {
  				const idP = params['id'];
                let federationId = params['delegateId'];
                if(!federationId){
                    federationId = FEDERATIONID();
                }
  				if (idP) {
  					  this.getRatings(idP,federationId);
  				}
          else {
            const idC = this.cookieService.get("company_id");
            if (idC) {
              this.getRatings(idC);
            }
          }
  			});
  		}
      else {
         this.getRatings(this.id,this.federationId);
      }
    }

    async getRatings(id,federationId=FEDERATIONID()) {

      if (federationId == "undefined" || federationId == "null")
        federationId = FEDERATIONID();

      const sellerNegotiationSettings = await this.userService.getCompanyNegotiationSettingsForParty(id,federationId);
      this.sellerNegoSettings = sellerNegotiationSettings;


      if( this.sellerNegoSettings != null && this.sellerNegoSettings.company.processID.length !=0){

        if(this.sellerNegoSettings.company.processID.indexOf('Fulfilment') != -1){
            this.deliveryPackage = true;
        }

        if(this.sellerNegoSettings.company.processID.indexOf('Ppap') != -1 || this.sellerNegoSettings.company.processID.indexOf('Item_Information_Request') != -1){
            this.prodListingAccu = true;
            this.conformToOtherAggre = true;
            this.ratingFulfillment = 0
        }

        if(this.sellerNegoSettings.company.processID.indexOf('Negotiation') != -1){
            this.negotiationQuality = true;
            this.ratingSeller = 0;
            this.responsetime = true;
        }

        if(this.sellerNegoSettings.company.processID.indexOf('Order') != -1 || this.sellerNegoSettings.company.processID.indexOf('Transport_Execution_Plan') != -1){
            this.orderQuality = true;
            this.ratingSeller = 0;
        }

      }

      this.initCallStatus.submit();

      this.bpeService.getRatingsSummary(id,federationId).then(ratings => {
        if (myGlobals.debug) {
          console.log("Fetched ratings: " + JSON.stringify(ratings));
        }
        this.ratings = ratings;
        if (this.ratings && this.ratings.totalNumberOfRatings > 0) {
          this.calcRatings();
          this.bpeService.getRatingsDetails(id,federationId).then(ratingDetails => {
            if (myGlobals.debug) {
              console.log("Fetched rating details: " + JSON.stringify(ratingDetails));
            }
            this.ratingDetails = ratingDetails;
          })
          .catch(error => {
            this.initCallStatus.error("Error while fetching company rating details", error);
          });
        }else{
          this.ratingStatus.emit(true);
        }
        this.initCallStatus.callback("Ratings successfully fetched", true);
      })
      .catch(error => {
        this.initCallStatus.error("Error while fetching company ratings", error);
      });
    }

    calcRatings() {
      this.ratings.qualityOfNegotiationProcess /= this.ratings.totalNumberOfRatings;
      this.ratings.qualityOfOrderingProcess /= this.ratings.totalNumberOfRatings;
      this.ratings.responseTimeRating /= this.ratings.totalNumberOfRatings;
      this.ratings.listingAccuracy /= this.ratings.totalNumberOfRatings;
      this.ratings.conformanceToContractualTerms /= this.ratings.totalNumberOfRatings;
      this.ratings.deliveryAndPackaging /= this.ratings.totalNumberOfRatings;
      this.ratingSeller = (this.ratings.qualityOfNegotiationProcess + this.ratings.qualityOfOrderingProcess + this.ratings.responseTimeRating) / 3;
      this.ratingFulfillment = (this.ratings.listingAccuracy + this.ratings.conformanceToContractualTerms) / 2;
      if(this.ratings.deliveryAndPackaging > 0){
        this.ratingOverall = (this.ratingSeller + this.ratingFulfillment + this.ratings.deliveryAndPackaging) / 3;
      }else{
        this.ratingOverall = (this.ratingSeller + this.ratingFulfillment) / 2;
      }
    }

}
