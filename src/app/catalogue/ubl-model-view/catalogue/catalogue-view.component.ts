import {Component, OnInit} from "@angular/core";
import {CookieService} from 'ng2-cookies';
import {CatalogueService} from "../../catalogue.service";
import {Catalogue} from "../../model/publish/catalogue";
import {CallStatus} from "../../../common/call-status";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {PublishService} from "../../publish-and-aip.service";
import {CategoryService} from "../../category/category.service";
import { isTransportService } from "../../../common/utils";
import { CatalogueLine } from "../../model/publish/catalogue-line";
import { BPDataService } from "../../../bpe/bp-view/bp-data-service";

@Component({
    selector: 'catalogue-view',
    templateUrl: './catalogue-view.component.html',
    styles: ['.dropdown-toggle:after{content: initial}'],
    providers: [CookieService]
})

export class CatalogueViewComponent implements OnInit {

    catalogue: Catalogue;

    // available catalogue lines with respect to the selected category
    catalogueLinesWRTTypes: any = [];
    // catalogue lines which are available to the user after search operation
    catalogueLinesArray : any = [];

    searchKey : string = "";

    // categories
    typeOfProducts : any = [];
    selectedType = "All";

    // necessary info for pagination
    collectionSize = 0;
    page = 1;
    // default
    pageSize = 10;

    // check whether catalogue-line-panel should be displayed for a specific catalogue line
    catalogueLineView = {};

    sortOption = null;

    getCatalogueStatus = new CallStatus();
    callStatus = new CallStatus();
    deleteStatuses: CallStatus[] = []

    constructor(private cookieService: CookieService,
                private publishService: PublishService,
                private catalogueService: CatalogueService,
                private categoryService: CategoryService,
                private bpDataService: BPDataService,
                private route: ActivatedRoute,
                private router: Router) {
        
    }

    ngOnInit() {
        this.catalogueService.setEditMode(false);

        this.route.queryParams.subscribe((params: Params) => {
            const forceUpdate = params['forceUpdate'] === "true";
            this.requestCatalogue(forceUpdate);
        });

        for(let i = 0; i < this.pageSize; i++) {
            this.deleteStatuses.push(new CallStatus());
        }
    }

    public requestCatalogue(forceUpdate:boolean): void {
        this.getCatalogueStatus.submit();
        let userId = this.cookieService.get("user_id");
        this.catalogueService.getCatalogueForceUpdate(userId, forceUpdate).then(catalogue => {
                this.catalogue = catalogue;
                this.getCatalogueStatus.callback(null);
                this.init();
            },
            error => {
                this.getCatalogueStatus.error("Failed to get catalogue", error);
            }
        )
    }

    init (): void {
        let len = this.catalogue.catalogueLine.length;
        this.collectionSize = len;
        this.catalogueLinesArray = [...this.catalogue.catalogueLine].reverse();
        this.catalogueLinesWRTTypes = this.catalogueLinesArray;
        let i = 0;
        this.typeOfProducts = [];
        this.selectedType = "All";
        this.searchKey = "";
        this.sortOption = null;
        // Initialize catalogueLineView and typeOfProducts
        for(;i<len;i++){
            this.catalogueLineView[this.catalogue.catalogueLine[i].id] = false;

            let j = 0;
            let lenOfCom = this.catalogue.catalogueLine[i].goodsItem.item.commodityClassification.length;
            for(;j<lenOfCom;j++){
                if(this.typeOfProducts.indexOf(this.catalogue.catalogueLine[i].goodsItem.item.commodityClassification[j].itemClassificationCode.name) <= -1){
                    this.typeOfProducts.push(this.catalogue.catalogueLine[i].goodsItem.item.commodityClassification[j].itemClassificationCode.name);
                }
            }
        }
    }

    onDeleteCatalogue(): void {
		if (confirm("Are you sure that you want to delete your entire catalogue?")) {
			this.callStatus.submit();

			this.catalogueService.deleteCatalogue().then(res => {
					this.catalogueService.catalogue = null;
					this.callStatus.reset();
					this.requestCatalogue(false);
				},
				error => {
					this.callStatus.error("Failed to delete catalogue", error);
				}
			);
		}
    }

    openCatalogueLinePage(catalogueLine: CatalogueLine) {
        const item = catalogueLine.goodsItem.item;
        this.bpDataService.previousProcess = null;
        this.router.navigate(['/product-details'], {
            queryParams: {
                catalogueId: item.catalogueDocumentReference.id,
                id: item.manufacturersItemIdentification.id
            },

        });
    }

    redirectToEdit(catalogueLine) {
        this.catalogueService.editCatalogueLine(catalogueLine);
        this.publishService.publishMode = 'edit';
        this.publishService.publishingStarted = false;
        this.categoryService.resetSelectedCategories();
        this.router.navigate(['catalogue/publish'], {queryParams: {
            pg: "single", 
            productType: isTransportService(catalogueLine) ? "transportation" : "product"}});
    }

    deleteCatalogueLine(catalogueLine, i: number): void {
        if (confirm("Are you sure that you want to delete this catalogue item?")) {
            const status = this.getDeleteStatus(i);
            status.submit();
            this.catalogueService.deleteCatalogueLine(this.catalogueService.catalogue.uuid, catalogueLine.id)
                .then(res => {
                    this.init();
                    status.callback("Catalogue line deleted", true);
                })
                .catch(error => {
                    status.error("Error while deleting catalogue line");
                });
        }
    }

    sortCatalogueLines(): void{
        if(this.sortOption == "Price:Low to High"){
            this.catalogueLinesArray.sort(function (a,b) {
                let x = parseInt(a.requiredItemLocationQuantity.price.priceAmount.value);
                let y = parseInt(b.requiredItemLocationQuantity.price.priceAmount.value);
                return x-y;
            });
        }
        else if(this.sortOption == "Price:High to Low"){
            this.catalogueLinesArray.sort(function (a,b) {
                let x = parseInt(a.requiredItemLocationQuantity.price.priceAmount.value);
                let y = parseInt(b.requiredItemLocationQuantity.price.priceAmount.value);
                return x-y;
            });
            this.catalogueLinesArray.reverse();
        }
    }

    typeChanged():void{
        this.searchKey = "";
        this.catalogueLinesWRTTypes = [];

        if (this.selectedType == "All") {
            this.catalogueLinesWRTTypes = [...this.catalogue.catalogueLine].reverse();
        } else {
            let i = 0;
            let len = this.catalogue.catalogueLine.length;
            for(;i<len;i++){
                let j = 0;
                let lenOfCom = this.catalogue.catalogueLine[i].goodsItem.item.commodityClassification.length;
                for(;j<lenOfCom;j++){
                    if(!(this.catalogue.catalogueLine[i].goodsItem.item.commodityClassification[j].itemClassificationCode.name.localeCompare(this.selectedType))){
                        this.catalogueLinesWRTTypes.unshift(this.catalogue.catalogueLine[i]);
                        break;
                    }
                }
            }
        }
        this.catalogueLinesArray = this.catalogueLinesWRTTypes;
        this.collectionSize = this.catalogueLinesArray.length;

        this.sortOption = "";
    }

    search():void{
        let splitArray = this.searchKey.split(" ").filter(
            item => item.trim() != "");
        let answer = [];
        let RE = new RegExp(splitArray.join("|"),"i");

        let i = 0;
        let len = this.catalogueLinesWRTTypes.length;
        for(;i<len;i++){
            if(RE.test(this.catalogueLinesWRTTypes[i].goodsItem.item.name+" "+
                    this.catalogueLinesWRTTypes[i].goodsItem.item.description)) {
                answer.push(this.catalogueLinesWRTTypes[i]);
            }
        }

        this.catalogueLinesArray = answer;
        this.collectionSize = this.catalogueLinesArray.length;
    }

    getDeleteStatus(index: number): CallStatus {
        return this.deleteStatuses[index % this.pageSize];
    }

    uploadImagePackage(event: any): void {
        this.callStatus.submit();
        let catalogueService = this.catalogueService;
        let fileList: FileList = event.target.files;
        if (fileList.length > 0) {
            let file: File = fileList[0];
            let self = this;
            var reader = new FileReader();
            reader.onload = function (e) {
                // reset the target value so that the same file could be chosen more than once
                event.target.value = "";
                catalogueService.uploadZipPackage(file).then(res => {
                        self.callStatus.callback(null);
                        self.router.navigate(['dashboard'], {queryParams: {forceUpdate: true, tab: "CATALOGUE"}});
                    },
                    error => {
                        self.callStatus.error("Failed to upload the image package:  " + error, error);
                    });
            };
            reader.readAsDataURL(file);
        }
    }

    navigateToThePublishPage(){
        this.router.navigate(['/catalogue/categorysearch']);
    }
}
