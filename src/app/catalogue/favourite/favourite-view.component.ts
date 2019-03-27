import {Component, OnInit} from "@angular/core";
import {CookieService} from 'ng2-cookies';
import {CatalogueService} from "../catalogue.service";
import {CallStatus} from "../../common/call-status";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {PublishService} from "../publish-and-aip.service";
import {CategoryService} from "../category/category.service";
import { isTransportService } from "../../common/utils";
import { BPDataService } from "../../bpe/bp-view/bp-data-service";
import { UserService } from "../../user-mgmt/user.service";
import { CompanySettings } from "../../user-mgmt/model/company-settings";
import {CataloguePaginationResponse} from '../model/publish/catalogue-pagination-response';
import {Item} from '../model/publish/item';
import {selectDescription, selectName} from '../../common/utils';
import {ItemProperty} from '../model/publish/item-property';
import {debounceTime, distinctUntilChanged, switchMap} from 'rxjs/operators';
import {Observable} from 'rxjs/Observable';
import {CATALOGUE_LINE_SORT_OPTIONS,FAVOURITE_LINEITEM_PUT_OPTIONS} from '../model/constants';
import { CatalogueLine } from "../model/publish/catalogue-line";

@Component({
    selector: 'favourite-view',
    templateUrl: './favourite-view.component.html',
    styles: ['.dropdown-toggle:after{content: initial}'],
    providers: [CookieService]
})

export class FavouriteViewComponent implements OnInit {

    catalogueResponse: Array<CatalogueLine>;
    settings: CompanySettings;

    // available catalogue lines with respect to the selected category
    catalogueLinesWRTTypes: any = [];
    // catalogue lines which are available to the user after search operation
    catalogueLinesArray : any = [];

    // necessary info for pagination
    collectionSize = 0;
    page = 1;
    // default
    pageSize = 3;

    // check whether catalogue-line-panel should be displayed for a specific catalogue line
    catalogueLineView = {};

    sortOption = null;

    getCatalogueStatus = new CallStatus();
    callStatus = new CallStatus();
    deleteStatuses: CallStatus[] = [];

    status = 1;
    hasFavourite = false;
    indexItem = 0;

    CATALOGUE_LINE_SORT_OPTIONS = CATALOGUE_LINE_SORT_OPTIONS;
    FAVOURITE_LINEITEM_PUT_OPTIONS = FAVOURITE_LINEITEM_PUT_OPTIONS;

    constructor(private cookieService: CookieService,
                private publishService: PublishService,
                private catalogueService: CatalogueService,
                private categoryService: CategoryService,
                private bpDataService: BPDataService,
                private userService: UserService,
                private route: ActivatedRoute,
                private router: Router) {

    }

    ngOnInit() {
        this.catalogueService.setEditMode(false);
        this.requestCatalogue();
        for(let i = 0; i < this.pageSize; i++) {
            this.deleteStatuses.push(new CallStatus());
        }
    }

    selectName (ip: ItemProperty | Item) {
        return selectName(ip);
    }

    selectDescription (item:  Item) {
        return selectDescription(item);
    }

    requestCatalogue(): void {
        this.getCatalogueStatus.submit();
        const userId = this.cookieService.get("user_id");
        // check whether the user chose a category to filter the catalogue lines
        this.sortOption = this.sortOption == null ? CATALOGUE_LINE_SORT_OPTIONS[0].name : this.sortOption;
        Promise.all([
            this.catalogueService.getFavouriteResponse(userId,this.pageSize,(this.page-1),this.sortOption),
            this.userService.getPerson(userId)
        ])
            .then(([catalogueResponse,person]) => {
                    this.catalogueResponse = catalogueResponse;
                    this.collectionSize = person.favouriteProductID.length;
                    if(this.collectionSize > 0 && this.catalogueResponse.length >0){
                        this.hasFavourite = true;
                        this.init();
                        
                    }else{
                        if(this.page > 1){
                            this.hasFavourite = true;
                            this.page = this.page-1;
                            this.requestCatalogue();
                            // this.onRegisteredCompaniesPageChange(this.page-1);
                        }else{
                            this.hasFavourite = false;
                        }
                    }
                    this.getCatalogueStatus.callback(null);
                },
                error => {
                    this.getCatalogueStatus.error("Failed to get catalogue", error);
                }
            )
    }

    private init(): void {
        let len = this.catalogueResponse.length;
        this.catalogueLinesArray = [...this.catalogueResponse];
        this.catalogueLinesWRTTypes = this.catalogueLinesArray;
        let i = 0;
        for(;i<len;i++){
            this.catalogueLineView[this.catalogueResponse[i].id] = false;
        }      
    }

    onOpenCatalogueLine(e: Event) {
        e.stopImmediatePropagation();
    }

    removeFavourite(catalogueLine, i: number,status?: number): void {
        this.status = status != null ? status : this.status; 
        const statuss = this.getDeleteStatus(i);
        statuss.submit();

        this.userService.putUserFavourite([catalogueLine.hjid+""],FAVOURITE_LINEITEM_PUT_OPTIONS[0].value)
            .then(res => {
                this.requestCatalogue();
                statuss.callback("Catalogue line removed", true);

            })
            .catch(error => {
                statuss.error("Error while removing catalogue line");                
            });
    }

    getDeleteStatus(index: number): CallStatus {
        return this.deleteStatuses[index % this.pageSize];
    }

    onRegisteredCompaniesPageChange(newPage): void {
        if (newPage) {
           this.requestCatalogue();
        }
    }

    navigateToTheSearchPage(){
        this.router.navigate(['/simple-search']);
    }

    viewCatalogueLine(cat : CatalogueLine){
        this.catalogueLineView[cat.id]=true;
        this.userService.getSettingsForProduct(cat).then(res => {
            this.settings = res;
        });
    }

}
