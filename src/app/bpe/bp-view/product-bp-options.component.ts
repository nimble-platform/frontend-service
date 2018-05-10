import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from "@angular/core";
import {BPDataService} from "./bp-data-service";
import {ActivatedRoute} from "@angular/router";
import {CallStatus} from "../../common/call-status";
import {CatalogueService} from "../../catalogue/catalogue.service";
import {Subscription} from "rxjs/Subscription";
import {SearchContextService} from "../../simple-search/search-context.service";
import {CatalogueLine} from "../../catalogue/model/publish/catalogue-line";
/**
 * Created by suat on 20-Oct-17.
 */
@Component({
    selector: 'product-bp-options',
    templateUrl: './product-bp-options.component.html'
})
export class ProductBpOptionsComponent implements OnInit, OnDestroy {
    // singular mode is true if only one business process view is to be presented
    @Input() singleMode: boolean = true;
    @Output() closeBpOptionsEvent = new EventEmitter();
    @Input() presentationMode: string = 'view';

    selectedOption: string;// = 'Negotiation';
    availableProcesses: string[] = [];
    processTypeSubs: Subscription;
    getCatalogueLineStatus: CallStatus = new CallStatus();
    precedingProcessId: string;

    constructor(public bpDataService: BPDataService,
                public catalogueService: CatalogueService,
                public searchContextService: SearchContextService,
                public route: ActivatedRoute) {
    }

    ngOnInit(): void {
        this.processTypeSubs = this.bpDataService.processTypeObservable.subscribe(processType => {
            if(processType) {
                this.selectedOption = processType;
            } else if(this.availableProcesses.length > 0) {
                this.selectedOption = this.availableProcesses[0];
            } else {
                this.selectedOption = 'Item_Information_Request';
            }
        });

        this.route.queryParams.subscribe(params => {
            let id = params['id'];
            let catalogueId = params['catalogueId'];
            this.precedingProcessId = params['pid'];

            this.getCatalogueLineStatus.submit();
            this.catalogueService.getCatalogueLine(catalogueId, id).then(line => {
                this.bpDataService.setCatalogueLines([this.removeUnnecessaryProperties(line)]);
                this.identifyAvailableProcesses();
                this.getCatalogueLineStatus.callback("Retrieved product details", true);
            }).catch(error => {
                this.getCatalogueLineStatus.error("Failed to retrieve product details");
            });
        });
    }

    private removeUnnecessaryProperties(line: CatalogueLine){
        if(this.bpDataService.processMetadata){
            // additionalItemProperties
            line.goodsItem.item.additionalItemProperty = this.bpDataService.processMetadata.product.additionalItemProperty;
            // dimensions
            line.goodsItem.item.dimension = this.bpDataService.processMetadata.product.dimension;
            // certificate
            line.goodsItem.item.certificate = this.bpDataService.processMetadata.product.certificate;
        }
        return line;
    }

    private identifyAvailableProcesses() {
        this.availableProcesses = [];

        // first check search context whether the search process is associated with a specific process
        if (this.searchContextService.associatedProcessType != null) {
            //this.availableProcesses.push(this.bpDataService.processTypeSubject.getValue());
            this.availableProcesses.push('Transport_Execution_Plan');

            // regular order and negotiation processes
        } else {
            this.availableProcesses.push('Item_Information_Request');
            this.availableProcesses.push('Negotiation');

            if (this.bpDataService.getCatalogueLine().goodsItem.item.transportationServiceDetails == null) {
                this.availableProcesses.push('Ppap');
                this.availableProcesses.push('Order');
            } else {
                this.availableProcesses.push('Transport_Execution_Plan');
            }
        }
    }

    ngOnDestroy(): void {
        this.processTypeSubs.unsubscribe();
    }

    closeBpOptions(): void {
        this.closeBpOptionsEvent.next();
    }
}
