import { Component, OnInit, Input,EventEmitter, Output } from "@angular/core";
import { BPEService } from "../bpe/bpe.service";
import { ActivatedRoute} from "@angular/router";
import { CookieService } from "ng2-cookies";
import * as myGlobals from "../globals";
import { CallStatus } from "../common/call-status";

@Component({
    selector: "company-rating",
    templateUrl: "./company-rating.component.html",
    styleUrls: ['./company-rating.component.css']
})
export class CompanyRatingComponent implements OnInit {

	@Input() id: any = null;
  @Input() hideTitle: boolean = false;
  @Output() ratingStatus = new EventEmitter<boolean>();

    initCallStatus: CallStatus = new CallStatus();
    ratings: any = null;
    ratingOverall = 0;
    ratingSeller = 0;
    ratingFulfillment = 0;

    constructor(private cookieService: CookieService,
                private bpeService: BPEService,
                public route: ActivatedRoute) {
    }

    ngOnInit() {
  		if(!this.id) {
  			this.route.queryParams.subscribe(params => {
  				const idP = params['id'];
  				if (idP) {
  					  this.getRatings(idP);
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
         this.getRatings(this.id);
      }
    }

    getRatings(id) {
      this.initCallStatus.submit();
      this.bpeService.getRatingsSummary(id).then(ratings => {
        if (myGlobals.debug) {
          console.log("Fetched ratings: " + JSON.stringify(ratings));
        }
        this.ratings = ratings;
        if (this.ratings.totalNumberOfRatings > 0) {
          this.calcRatings();
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
      this.ratingOverall = (this.ratingSeller + this.ratingFulfillment + this.ratings.deliveryAndPackaging) / 3;
    }

}
