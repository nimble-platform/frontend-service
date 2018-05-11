import {Component, OnInit} from "@angular/core";
import {CookieService} from 'ng2-cookies';
import {CatalogueService} from "../../catalogue.service";
import {Catalogue} from "../../model/publish/catalogue";
import {CallStatus} from "../../../common/call-status";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {PublishService} from "../../publish-and-aip.service";
import {CategoryService} from "../../category/category.service";

@Component({
    selector: 'catalogue-view',
    templateUrl: './catalogue-view.component.html',
    providers: [CookieService]
})

export class CatalogueViewComponent implements OnInit {

    private getCatalogueStatus = new CallStatus();
    private deleteCatalogueStatus = new CallStatus();

    constructor(private cookieService: CookieService,
                private catalogueService: CatalogueService,
                private route: ActivatedRoute,
                private publishService: PublishService,
                private categoryService: CategoryService,
                private router: Router) {
    }

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

    ngOnInit() {
        this.catalogueService.setEditMode(false);

        let forceUpdate:boolean = false;
        this.route.queryParams.subscribe((params: Params) => {
            forceUpdate = params['forceUpdate'] == "true";
            this.requestCatalogue(forceUpdate);
        });
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
                this.getCatalogueStatus.error("Failed to get catalogue");
            }
        )
    }

    init (): void {
        let len = this.catalogue.catalogueLine.length;
        this.collectionSize = len;
        this.catalogueLinesArray = this.catalogue.catalogueLine;
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

    public onDeleteCatalogue(): void {
		if (confirm("Are you sure that you want to delete your entire catalogue?")) {
			this.deleteCatalogueStatus.submit();

			this.catalogueService.deleteCatalogue().then(res => {
					this.catalogueService.catalogue = null;
					this.deleteCatalogueStatus.reset();
					this.requestCatalogue(false);
					/*this.fb_get_catalogue_callback = true;
					 this.fb_get_catalogue_submitted = false;*/
				},
				error => {
					this.deleteCatalogueStatus.error("Failed to delete catalogue");
				}
			);
		}
    }

    redirectToEdit(catalogueLine) {
        this.catalogueService.editCatalogueLine(catalogueLine);
        this.publishService.publishMode = 'edit';
        this.publishService.publishingStarted = false;
        this.categoryService.resetSelectedCategories();
        this.router.navigate(['catalogue/publish'], {queryParams: {pg: "single"}});
    }

    deleteCatalogueLine(catalogueLine): void {
        if (confirm("Are you sure that you want to delete this catalogue item?")) {
            this.catalogueService.deleteCatalogueLine(this.catalogueService.catalogue.uuid, catalogueLine.id).then(res => {
                this.init();
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

        if(this.selectedType == "All"){
            this.catalogueLinesWRTTypes = this.catalogue.catalogueLine;
        }
        else{
            let i = 0;
            let len = this.catalogue.catalogueLine.length;
            for(;i<len;i++){
                let j = 0;
                let lenOfCom = this.catalogue.catalogueLine[i].goodsItem.item.commodityClassification.length;
                for(;j<lenOfCom;j++){
                    if(!(this.catalogue.catalogueLine[i].goodsItem.item.commodityClassification[j].itemClassificationCode.name.localeCompare(this.selectedType))){
                        this.catalogueLinesWRTTypes.push(this.catalogue.catalogueLine[i]);
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

    private uploadImagePackage(event: any): void {
        this.deleteCatalogueStatus.submit();
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
                        self.deleteCatalogueStatus.callback(null);
                        self.router.navigate(['catalogue/catalogue'], {queryParams: {forceUpdate: true}});
                    },
                    error => {
                        self.deleteCatalogueStatus.error("Failed to upload the image package:  " + error);
                    });
            };
            reader.readAsDataURL(file);
        }
    }

    private navigateToThePublishPage(){
        this.router.navigate(['/catalogue/categorysearch']);
    }
}
