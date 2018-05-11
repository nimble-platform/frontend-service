import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {BPDataService} from './bp-data-service';

@Component({
    selector: 'businessProcess-options',
    templateUrl: './business-process-options.html'
})

export class BusinessProcessOptions implements OnInit {
    @Input() processName:string;
    @Input() transportationService:boolean;
    @Input() userRole:string;
    @Input() acceptedIndicator:boolean;

    @Output() searchTransportServiceProvider = new EventEmitter();
    @Output() selectedTabChanged = new EventEmitter();

    followUpProcesses:string [] = [];
    nextProcess:string;


    constructor(private bpDataService:BPDataService){
    }

    ngOnInit() {
        if(this.processName == "Item_Information_Request"){
            if(this.userRole == "buyer"){
                this.followUpProcesses.push("Item Information Request");
                if(!this.transportationService){
                    this.followUpProcesses.push("PPAP");
                    this.followUpProcesses.push("Negotiation");
                    this.followUpProcesses.push("Order");
                }
                else{
                    this.followUpProcesses.push("Negotiation");
                }
            }
        }
        else if(this.processName == "Negotiation"){
            if(this.userRole == "buyer"){
                if(this.transportationService){
                    this.followUpProcesses.push("Request New Quotation");
                    this.followUpProcesses.push("Initiate Transport Execution Plan");
                }
                else{
                    this.followUpProcesses.push("PPAP");
                    this.followUpProcesses.push("Request New Quotation");
                    this.followUpProcesses.push("Order");
                }
            }
        }
        else if(this.processName == "Ppap"){
            if(this.userRole == "buyer"){
                this.followUpProcesses.push("Item Information Request");
                this.followUpProcesses.push("PPAP");
                this.followUpProcesses.push("Negotiation");
                this.followUpProcesses.push("Order");
            }
        }
        else if(this.processName == "Order"){
            if(this.userRole == "seller" && this.acceptedIndicator){
                this.followUpProcesses.push("Search Transport Service Provider");
                this.followUpProcesses.push("Initiate Despatch Advice");
            }
            else if(this.userRole == "buyer" && this.acceptedIndicator){
                this.followUpProcesses.push("PPAP");
            }
            else if(this.userRole == "buyer" && !this.acceptedIndicator){
                this.followUpProcesses.push("PPAP");
                this.followUpProcesses.push("Negotiation");
                this.followUpProcesses.push("Order")
            }
        }
        else if(this.processName == "Transport_Execution_Plan"){
            if(this.userRole == 'buyer' && !this.acceptedIndicator){
                this.followUpProcesses.push("Negotiation");
                this.followUpProcesses.push("Transport Execution Plan")
            }
        }
    }

    continueWithNextProcess(){
        if(this.nextProcess == "PPAP"){
            this.bpDataService.resetBpData();
            this.bpDataService.initPpap([]);
            this.bpDataService.setBpOptionParameters(this.userRole, 'Ppap');
            this.selectedTabChanged.next();
        }
        else if(this.nextProcess == "Request New Quotation"){
            this.bpDataService.initRfqWithQuotation();
            this.bpDataService.setBpOptionParameters(this.userRole, 'Negotiation');
            this.selectedTabChanged.next();
        }
        else if(this.nextProcess == "Negotiation"){
            this.bpDataService.resetBpData();
            this.bpDataService.initRfq();
            this.bpDataService.setBpOptionParameters(this.userRole, 'Negotiation');
        }
        else if(this.nextProcess == "Item Information Request"){
            this.bpDataService.resetBpData();
            this.bpDataService.initItemInformationRequest();
            this.bpDataService.setBpOptionParameters(this.userRole,'Item_Information_Request');
        }
        else if(this.nextProcess == "Order"){
            if(this.processName == "Negotiation"){
                this.bpDataService.initOrderWithQuotation();
                this.bpDataService.setBpOptionParameters(this.userRole,'Order');
            }
            else if(this.processName == 'Order'){
                this.bpDataService.initOrderWithExistingOrder();
                this.bpDataService.setBpOptionParameters(this.userRole,'Order');
                this.selectedTabChanged.next();
            }
            else{
                this.bpDataService.resetBpData();
                this.bpDataService.setBpOptionParameters(this.userRole,'Order');
            }
        }
        else if(this.nextProcess == "Transport Execution Plan"){
            this.bpDataService.resetBpData();
            this.bpDataService.initTransportExecutionPlanRequest();
            this.bpDataService.setBpOptionParameters(this.userRole,'Transport_Execution_Plan');
            this.selectedTabChanged.next();
        }
        else if(this.nextProcess == "Initiate Transport Execution Plan"){
            this.bpDataService.initTransportExecutionPlanRequestWithQuotation();
            this.bpDataService.setBpOptionParameters(this.userRole,'Transport_Execution_Plan');
        }
        else if(this.nextProcess == "Initiate Despatch Advice"){
            this.bpDataService.initDespatchAdviceWithOrder();
            this.bpDataService.setBpOptionParameters(this.userRole, 'Fulfilment');
        }
        else if(this.nextProcess == "Search Transport Service Provider"){
            this.selectedTabChanged.next();
            this.searchTransportServiceProvider.next();
        }
    }
}