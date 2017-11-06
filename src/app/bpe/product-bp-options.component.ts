import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from "@angular/core";
import {CatalogueLine} from "../catalogue/model/publish/catalogue-line";
import {BPDataService} from "./bp-data-service";
import {ActivatedRoute} from "@angular/router";
import {CallStatus} from "../common/call-status";
import {CatalogueService} from "../catalogue/catalogue.service";
import {Subscription} from "rxjs/Subscription";
/**
 * Created by suat on 20-Oct-17.
 */
@Component({
    selector: 'product-bp-options',
    templateUrl: './product-bp-options.component.html'
})
export class ProductBpOptionsComponent implements OnInit, OnDestroy {
    // singular mode is true if only one business process view is to be presented
    @Input() singleMode:boolean = true;
    @Output() closeBpOptionsEvent = new EventEmitter();

    selectedOption:string;// = 'Negotiation';
    processTypeSubs:Subscription;
    getCatalogueLineStatus:CallStatus = new CallStatus();

    constructor(public bpDataService: BPDataService,
                public catalogueService:CatalogueService,
                public route: ActivatedRoute) {
    }

    ngOnInit(): void {
        this.processTypeSubs = this.bpDataService.processTypeObs.subscribe(processType => {
            this.selectedOption = processType;
        });

        this.route.queryParams.subscribe(params => {
            let id = params['id'];
            let catalogueId = params['catalogueId'];

            // if the catalgoue line is already fetched, use it
            if(this.bpDataService.catalogueLine != null &&
               this.bpDataService.catalogueLine.id == id &&
               this.bpDataService.catalogueLine.goodsItem.item.catalogueDocumentReference.id == catalogueId) {
                    return;
            }

            this.getCatalogueLineStatus.submit();
            this.catalogueService.getCatalogueLine(catalogueId, id).then(line => {
                this.bpDataService.catalogueLine = line;
                this.getCatalogueLineStatus.callback("Retrieved product details", true);
            }).catch(error => {
                this.getCatalogueLineStatus.error("Failed to retrieve product details");
            });
        });
    }

    ngOnDestroy(): void {
        this.processTypeSubs.unsubscribe();
    }

    closeBpOptions():void {
        this.closeBpOptionsEvent.next();
    }
}
