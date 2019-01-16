import {Component, OnInit, ViewChild} from '@angular/core';
import { ActivatedRoute, Router } from "@angular/router";
import { CatalogueService } from "../catalogue/catalogue.service";
import { CallStatus } from "../common/call-status";
import { BPDataService } from "../bpe/bp-view/bp-data-service";
import { CatalogueLine } from "../catalogue/model/publish/catalogue-line";
import { BpWorkflowOptions } from "../bpe/model/bp-workflow-options";
import { ProcessType } from "../bpe/model/process-type";
import { ProductWrapper } from "../common/product-wrapper";
import { Item } from "../catalogue/model/publish/item";
import { PriceWrapper } from "../common/price-wrapper";
import { getMaximumQuantityForPrice, getStepForPrice, isTransportService } from "../common/utils";
import { AppComponent } from "../app.component";
import { UserService } from "../user-mgmt/user.service";
import { CompanySettings } from "../user-mgmt/model/company-settings";
import {Quantity} from '../catalogue/model/publish/quantity';
import {DiscountModalComponent} from './discount-modal.component';

@Component({
    selector: 'product-details',
    templateUrl: './product-details.component.html',
    styleUrls: ['./product-details.component.css']
})
export class ProductDetailsComponent implements OnInit {

    getProductStatus: CallStatus = new CallStatus();

    id: string;
    catalogueId: string;

    options: BpWorkflowOptions = new BpWorkflowOptions();

    line?: CatalogueLine;
    item?: Item;
    wrapper?: ProductWrapper;
    settings?: CompanySettings;
    priceWrapper?: PriceWrapper;

    toggleImageBorder: boolean = false;
    showNavigation: boolean = true;
    showProcesses: boolean = true;
    isLogistics: boolean = false;

    @ViewChild(DiscountModalComponent)
    private discountModal: DiscountModalComponent;

    constructor(private bpDataService: BPDataService,
                private catalogueService: CatalogueService,
                private userService: UserService,
                private route: ActivatedRoute,
                private router: Router,
                public appComponent: AppComponent) {

    }

    ngOnInit() {
        this.bpDataService.setCatalogueLines([], []);
		this.route.queryParams.subscribe(params => {
			let id = params['id'];
            let catalogueId = params['catalogueId'];

            if(id !== this.id || catalogueId !== this.catalogueId) {
                this.id = id;
                this.catalogueId = catalogueId;

                this.getProductStatus.submit();
                this.catalogueService.getCatalogueLine(catalogueId, id)
                    .then(line => {
                        this.line = line;
                        this.item = line.goodsItem.item;
                        this.isLogistics = isTransportService(this.line);
                        return this.userService.getSettingsForProduct(line)
                    })
                    .then(settings => {
                        this.settings = settings;
                        this.priceWrapper = new PriceWrapper(this.line.requiredItemLocationQuantity.price,new Quantity(1, this.line.requiredItemLocationQuantity.price.baseQuantity.unitCode),this.line.priceOption);
                        this.wrapper = new ProductWrapper(this.line, settings.negotiationSettings,this.priceWrapper.quantity);
                        this.bpDataService.resetBpData();
                        this.bpDataService.setCatalogueLines([this.line], [settings]);
                        this.bpDataService.userRole = 'buyer';
                        this.bpDataService.workflowOptions = this.options;
                        this.bpDataService.setRelatedGroupId(null);
                        this.bpDataService.setCollaborationGroupId(null);
                        this.getProductStatus.callback("Retrieved product details", true);
                    })
                    .catch(error => {
                        this.getProductStatus.error("Failed to retrieve product details", error);

                        this.line = null;
                        this.wrapper = null;
                    });
            }
		});
    }

    /*
     * Event Handlers
     */

    onNegotiate(): void {
        this.navigateToBusinessProcess("Negotiation");
    }

    onRequestInformation(): void {
        this.navigateToBusinessProcess("Item_Information_Request");
    }

    onStartPpap(): void {
        this.navigateToBusinessProcess("Ppap");
    }

    private navigateToBusinessProcess(targetProcess: ProcessType): void {
        this.bpDataService.resetBpData();
        this.bpDataService.setBpOptionParameters("buyer", targetProcess);
        this.router.navigate(['bpe/bpe-exec'], {
            queryParams: {
                catalogueId: this.catalogueId,
                id: this.id
            }
        });
    }

    /*
     * Getters For Template
     */

    getPricePerItem(): string {
        this.updatePriceWrapperOnUserSelections();
        return this.priceWrapper.pricePerItemString;
    }

    getTotalPrice(): number {
        this.updatePriceWrapperOnUserSelections();
        return this.priceWrapper.totalPrice;
    }

    hasPrice(): boolean {
        return this.priceWrapper.hasPrice();
    }

    getMaximumQuantity(): number {
        return getMaximumQuantityForPrice(this.priceWrapper.price);
    }

    getSteps(): number {
        return getStepForPrice(this.priceWrapper.price);
    }

    getQuantityUnit(): string {
        if(!this.line) {
            return "";
        }
        return this.line.requiredItemLocationQuantity.price.baseQuantity.unitCode || "";
    }

    isPpapAvailable(): boolean {
        return this.settings && !!this.settings.tradeDetails.ppapCompatibilityLevel;
    }

    private updatePriceWrapperOnUserSelections() {
        let copyItem = JSON.parse(JSON.stringify(this.item));
        this.bpDataService.selectFirstValuesAmongAlternatives(copyItem);
        this.priceWrapper.additionalItemProperties = copyItem.additionalItemProperty;
        this.priceWrapper.quantity.value = this.options.quantity;
    }

    private openDiscountModal(): void{
        this.discountModal.open(this.priceWrapper.appliedDiscounts,this.priceWrapper.price.priceAmount.currencyID);
    }
}
