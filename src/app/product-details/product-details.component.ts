import { Component, OnInit, Predicate } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { CatalogueService } from "../catalogue/catalogue.service";
import { CallStatus } from "../common/call-status";
import { BPDataService } from "../bpe/bp-view/bp-data-service";
import { CatalogueLine } from "../catalogue/model/publish/catalogue-line";
import { GoodsItem } from "../catalogue/model/publish/goods-item";
import { Item } from "../catalogue/model/publish/item";
import { ProductDetailsTab } from "./model/product-details-tab";
import { CommodityClassification } from "../catalogue/model/publish/commodity-classification";
import { ItemProperty } from "../catalogue/model/publish/item-property";
import { BpWorkflowOptions } from "../bpe/model/bp-workflow-options";
import { ProcessType } from "../bpe/model/process-type";
import { Quantity } from "../catalogue/model/publish/quantity";
import { UblModelAccessors } from "../catalogue/model/ubl-model-accessors";
import { PAYMENT_MEANS } from "../catalogue/model/constants";
import { UBLModelUtils } from "../catalogue/model/ubl-model-utils";
import { sanitizePropertyName } from "../common/utils";

@Component({
    selector: 'product-details',
    templateUrl: './product-details.component.html',
    styleUrls: ['./product-details.component.css']
})
export class ProductDetailsComponent implements OnInit {

    getProductStatus:CallStatus = new CallStatus();

    id: string;
    catalogueId: string;

    options: BpWorkflowOptions = new BpWorkflowOptions();

    line?: CatalogueLine;
    goodsItem?: GoodsItem;
    item?: Item;

    selectedTab: ProductDetailsTab = "DETAILS";
    selectedImage: number = 0;
    toggleImageBorder: boolean = false;
    showNavigation: boolean = true;
    showProcesses: boolean = true;

    constructor(private bpDataService: BPDataService,
                private catalogueService: CatalogueService,
                private route: ActivatedRoute,
                private router: Router) {
        
    }

    ngOnInit() {
        this.bpDataService.setCatalogueLines([]);
        this.getProductStatus.submit();
		this.route.queryParams.subscribe(params => {
			let id = params['id'];
            let catalogueId = params['catalogueId'];
            
            if(id !== this.id || catalogueId !== this.catalogueId) {
                this.id = id;
                this.catalogueId = catalogueId;

                this.catalogueService.getCatalogueLine(catalogueId, id).then(line => {
                    this.line = line;
                    this.goodsItem = line.goodsItem;
                    this.item = this.goodsItem.item;
                    this.bpDataService.resetBpData();
                    this.bpDataService.setCatalogueLines([line]);
                    this.bpDataService.userRole = 'buyer';
                    this.bpDataService.workflowOptions = this.options;
                    this.bpDataService.setRelatedGroupId(null);
                    this.getProductStatus.callback("Retrieved product details", true);
                }).catch(error => {
                    this.getProductStatus.error("Failed to retrieve product details");
                    console.log("Error while retrieving product", error);

                    this.line = null;
                    this.goodsItem = null;
                    this.item = null;
                });
            }
		});
    }

    /*
     * Event Handlers
     */

    onSelectTab(event: any): void {
        event.preventDefault();
        this.selectedTab = event.target.id;
        // TODO fetch
    }

    onSelectImage(index: number): void {
        this.selectedImage = index;
        if(!this.item) {
            return;
        }
        if(this.selectedImage < 0) {
            this.selectedImage = this.item.productImage.length - 1;
        }
        // also works if productImage.length === 0
        if(this.selectedImage >= this.item.productImage.length) {
            this.selectedImage = 0;
        }
    }

    navigateImages(index: number, length: number): number {
        if(index < 0) {
            return length - 1;
        }
        else if(index < length) {
            return index;
        }
        // also works if productImage.length === 0
        else if(index >= length) {
            return 0;
        }
    }

    onTogglePropertyValue(property: ItemProperty, valueIndex: number): void {
        this.options.selectedValues[this.getKey(property)] = valueIndex;
    }

    onNegotiate(): void {
        this.navigateToBusinessProcess("Negotiation");
    }

    onRequestInformation(): void {
        this.navigateToBusinessProcess("Item_Information_Request");
    }

    onStartPpap(): void {
        this.navigateToBusinessProcess("Ppap");
    }

    onPreviewTermsAndConditions(): void {
        console.log("PreviewTermsAndConditions clicked!");
    }

    private navigateToBusinessProcess(targetProcess: ProcessType): void {
        this.bpDataService.resetBpData();
        this.bpDataService.setBpOptionParameters("buyer", targetProcess, null);
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

    getClassifications(): CommodityClassification[] {
        if(!this.item) {
            return [];
        }

        return this.item.commodityClassification
            .filter(c => c.itemClassificationCode.listID != 'Default')
            .sort((c1, c2) => c1.itemClassificationCode.name.localeCompare(c2.itemClassificationCode.name));
    }
    
    getUniqueProperties(): ItemProperty[] {
        return this.getUniquePropertiesWithFilter(prop => prop.value.join() !== "");
    }

    getPropertyName(property: ItemProperty): string {
        return sanitizePropertyName(property.name);
    }

    getPropertiesWithListOfValues(): ItemProperty[] {
        return this.getUniquePropertiesWithFilter(prop => prop.value.length > 1);
    }

    isPropertyValueSelected(property: ItemProperty, valueIndex: number): boolean {
        const selected = this.options.selectedValues[this.getKey(property)] || 0;
        return valueIndex === selected;
    }

    getPricePerItem(): string {
        return UblModelAccessors.getPricePerItemString(this.line.requiredItemLocationQuantity.price);
    }

    getTotalPrice(): number {
        return UblModelAccessors.getTotalPrice(this.line.requiredItemLocationQuantity, this.options.quantity);
    }

    hasPrice(): boolean {
        return UblModelAccessors.hasPrice(this.line.requiredItemLocationQuantity);
    }

    getDeliveryPeriod(): string {
        return UblModelAccessors.getPeriodString(this.goodsItem.deliveryTerms.estimatedDeliveryPeriod);
    }

    getWarrantyPeriod(): string {
        return UblModelAccessors.getPeriodString(this.line.warrantyValidityPeriod);
    }

    getIncoterms(): string {
        return this.goodsItem.deliveryTerms.incoterms || "None";
    }

    getPaymentTerms(): string {
        return UBLModelUtils.getDefaultPaymentTermsAsStrings()[0];
    }

    getPaymentMeans(): string {
        return PAYMENT_MEANS[0];
    }

    getFreeSample(): string {
        return this.line.freeOfChargeIndicator ? "Yes" : "No";
    }

    getSpecialTerms(): string {
        return this.goodsItem.deliveryTerms.specialTerms || "None";
    }

    getPackaging(): string {
        const qty = this.goodsItem.containingPackage.quantity;
        const type = this.goodsItem.containingPackage.packagingTypeCode;
        if(!qty.value || !type.value) {
            return "Not specified";
        }

        return `${qty.value} ${qty.unitCode} per ${type.value}`;
    }

    getMaximumQuantity(): number {
        return UblModelAccessors.getMaximumQuantityForPrice(this.line.requiredItemLocationQuantity.price);
    }

    getSteps(value: number): number {
        return UblModelAccessors.getStepForPrice(this.line.requiredItemLocationQuantity.price);
    }

    /*
     * Internal methods
     */

    private getUniquePropertiesWithFilter(filter: Predicate<ItemProperty>): ItemProperty[] {
        if(!this.item) {
            return [];
        }

        const duplicates: any = {};
        const result = [];
        this.item.additionalItemProperty.forEach(prop => {
            if(!filter(prop)) {
                return;
            }

            const key = this.getKey(prop);
            if(!duplicates[key]) {
                result.push(prop);
            }

            duplicates[key] = true;
        })

        return result.sort((p1, p2) => p1.name.localeCompare(p2.name));
    }

    private getKey(property: ItemProperty): string {
         return property.name + "___" + property.valueQualifier;
    }

}