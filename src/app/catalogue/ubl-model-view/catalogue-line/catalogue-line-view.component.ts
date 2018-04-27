import {Component, EventEmitter, Input, Output} from "@angular/core";
import {CatalogueLine} from "../../model/publish/catalogue-line";
import * as myGlobals from "../../../globals";
import {FormGroup} from "@angular/forms";
import {ChildForm} from "../../child-form";
import {PublishService} from "../../publish-and-aip.service";

@Component({
    selector: 'catalogue-line-view',
    templateUrl: './catalogue-line-view.component.html'
})

// Component that displays information for individual catalogue lines in the Catalogue page

export class CatalogueLineViewComponent extends ChildForm {

    @Input() catalogueLine: CatalogueLine;
    @Input() presentationMode: string;
    @Input() parentForm: FormGroup;
    @Input() fromSearchDetails: boolean = false;
    @Output() openBpOptionsEvent:EventEmitter<any> = new EventEmitter();

    selectedTab: string = "Product Details";
    partyRole: string = "";
    regularProductDetailsForm: FormGroup = new FormGroup({});
    transportationServiceDetailsForm: FormGroup = new FormGroup({});
	public debug = myGlobals.debug;

	constructor(private publishService: PublishService) {
	    super();
    }

	ngOnInit() {
	    this.addToParentForm('productDetails', this.regularProductDetailsForm);
	    if(this.catalogueLine.goodsItem.item.transportationServiceDetails != null) {
	        this.changePartyRole('Transport Service Provider')
        }
    }

    ngOnDestroy() {
	    this.removeFromParentForm('productDetails');
	    this.removeFromParentForm('transportationServiceDetails');
    }


    changePartyRole(role:string) {
        this.partyRole = role;
        if(role == 'Manufacturer') {
            this.removeFromParentForm('transportationServiceDetails');
            this.addToParentForm('productDetails', this.regularProductDetailsForm);
            this.publishService.publishedProductNature = 'Regular product';

        } else if(role == 'Transport Service Provider') {
            this.removeFromParentForm('productDetails');
            this.addToParentForm('transportationServiceDetails', this.transportationServiceDetailsForm);
            this.publishService.publishedProductNature = 'Transportation service';
        }
    }
}
