import { Component, OnInit } from "@angular/core";
import { UserService } from './user.service';
import { CookieService } from 'ng2-cookies';
import { CallStatus } from '../common/call-status';
import {TranslateService} from '@ngx-translate/core';
import { Router } from "@angular/router";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {AgentService} from "./agent.service";
import Swal from 'sweetalert2';

type SelectedTab = "SELLING_AGENT"
    | "BUYING_AGENT";

@Component({
    selector: "user-profile",
    templateUrl: "./agents.component.html",
    styleUrls: ["./agents.component.css"]
})
export class AgentsComponent implements OnInit {

    Currency: any = ['EUR'];
    agentList = [];
    buyingAgentList = [];
    showCreateSellingAgent = false;
    showCreateBuyingAgent = false;
    showEmptyPageSA = false;
    showEmptyPageBA = false;

    sellingAgentForm: FormGroup;
    buyingAgentForm: FormGroup;
    selectedTab: SelectedTab = "SELLING_AGENT";
    callStatus: CallStatus = new CallStatus();
    orders = [];
    results = {count: 3, pageSize: 10,};
    showTransactions = false;
    selectedAgent = '';

    constructor(private userService: UserService,
                private agentService: AgentService,
                private translate: TranslateService,
                private cookieService: CookieService,
                private router: Router,
                private _fb: FormBuilder,
                private modalService: NgbModal
    ) {

    }

    ngOnInit() {

        this.callStatus.submit();
        this.sellingAgentForm = this._fb.group({
            agentName: ['', Validators.required],
            maxContractAmount: ['', Validators.required],
            maxContractAmountUnit: ['', Validators.required],
            minFulfillmentTime: ['', Validators.required],
            minFulfillmentTimeUnit: ['', Validators.required],
            maxFulfillmentTime: ['', Validators.required],
            maxFulfillmentTimeUnit: ['', Validators.required],
            maxVolume: ['', Validators.required],
            maxVolumeUnit: ['', Validators.required],
            maxNoOneToOne: ['', Validators.required],
            maxNoOneToOneUnit: ['', Validators.required],
            productNames: ['', Validators.required],
            maxNoContractPerDay: ['', Validators.required],
            companyList: ['', Validators.required],
        });

        this.buyingAgentForm = this._fb.group(({
            agentName: ['', Validators.required],
            maxContractAmount: ['', Validators.required],
            maxContractAmountUnit: ['', Validators.required],
            minFulfillmentTime: ['', Validators.required],
            minFulfillmentTimeUnit: ['', Validators.required],
            maxFulfillmentTime: ['', Validators.required],
            maxFulfillmentTimeUnit: ['', Validators.required],
            maxVolume: ['', Validators.required],
            maxVolumeUnit: ['', Validators.required],
            maxNoOneToOne: ['', Validators.required],
            maxNoOneToOneUnit: ['', Validators.required],
            productNames: ['', Validators.required],
            maxNoContractPerDay: ['', Validators.required],
            productList: ['', Validators.required],
            companyList: ['', Validators.required],
        }));

        this.orders = [

        ];

        this.getAllSellingAgents();
        this.getAllBuyingAgents();
    }

    get f() {
        return this.sellingAgentForm.controls;
    }

    get form() {
        return this.buyingAgentForm.controls;
    }

    editSellingAgent(id) {
        this.sellingAgentForm.get("agentName").setValue("");
        this.sellingAgentForm.get("maxContractAmount").setValue("");
        this.sellingAgentForm.get("maxContractAmountUnit").setValue("");
        this.sellingAgentForm.get("minFulfillmentTime").setValue("");
        this.sellingAgentForm.get("minFulfillmentTimeUnit").setValue("");
        this.sellingAgentForm.get("maxFulfillmentTime").setValue("");
        this.sellingAgentForm.get("maxFulfillmentTimeUnit").setValue("");
        this.sellingAgentForm.get("maxVolume").setValue("");
        this.sellingAgentForm.get("maxVolumeUnit").setValue("");
        this.sellingAgentForm.get("maxNoOneToOne").setValue("");
        this.sellingAgentForm.get("maxNoOneToOneUnit").setValue("");
        this.sellingAgentForm.get("productNames").setValue("");
        this.sellingAgentForm.get("maxNoContractPerDay").setValue("");
        // show the create form
    }

    editBuyingAgent(id) {
        this.buyingAgentForm.get("agentName").setValue("");
        this.buyingAgentForm.get("maxContractAmount").setValue("");
        this.buyingAgentForm.get("maxContractAmountUnit").setValue("");
        this.buyingAgentForm.get("minFulfillmentTime").setValue("");
        this.buyingAgentForm.get("minFulfillmentTimeUnit").setValue("");
        this.buyingAgentForm.get("maxFulfillmentTime").setValue("");
        this.buyingAgentForm.get("maxFulfillmentTimeUnit").setValue("");
        this.buyingAgentForm.get("maxVolume").setValue("");
        this.buyingAgentForm.get("maxVolumeUnit").setValue("");
        this.buyingAgentForm.get("maxNoOneToOne").setValue("");
        this.buyingAgentForm.get("maxNoOneToOneUnit").setValue("");
        this.buyingAgentForm.get("productNames").setValue("");
        this.buyingAgentForm.get("maxNoContractPerDay").setValue("");
        // show the create form
    }

    getAllSellingAgents(){
        this.agentService.getAllSellingAgents().then((data) => {
            this.agentList = data;
            if(data.length == 0){
                this.showEmptyPageSA = true;
            }

        }).catch(err => {
            console.log('Error when retrieving selling agents')
        });
    }

    getAllBuyingAgents(){
        this.agentService.getAllBuyingAgents().then((data) => {
            this.buyingAgentList = data;
            if(data.length == 0){
                this.showEmptyPageBA = true;
            }
        }).catch(err => {
            console.log('Error when retrieving selling agents')
        });
    }

    submitBuyingAgent() {
        let buyingAgentData = {
            companyID: this.cookieService.get("company_id"),
            name: this.form.agentName.value,
            maxContractAmount: {
                value: this.form.maxContractAmount.value,
                unit: this.form.maxContractAmountUnit.value
            },
            minFulfillmentTime: {
                value: this.form.minFulfillmentTime.value,
                unit: this.form.minFulfillmentTimeUnit.value
            },
            maxFulfillmentTime: {
                value: this.form.maxFulfillmentTime.value,
                unit: this.form.maxFulfillmentTimeUnit.value
            },
            maxVolume: {
                value: this.form.maxVolume.value,
                unit: this.form.maxVolumeUnit.value
            },
            maxNoOneToOne: {
                value: this.form.maxNoOneToOne.value,
                unit: this.form.maxNoOneToOneUnit.value
            },
            productNames: this.form.productNames.value.split(";"),
            maxNoContractPerDay: this.form.maxNoContractPerDay.value,
        };

        this.agentService.createBuyingAgent(buyingAgentData).then((res) => {
            this.showCreateSellingAgent = false;
            Swal.fire({
                title: 'Success!',
                showConfirmButton: false,
                timer: 2000,
                text: 'The agent has been created!',
                icon: 'success',
            });
        }).catch((err) => {
            Swal.fire({
                title: 'Failed!',
                showConfirmButton: false,
                timer: 2000,
                text: 'Failed to create the buying agent!',
                icon: 'error',
            });
        })
    }

    submitSellingAgent(){
        let sellingAgentData = {
            companyID: this.cookieService.get("company_id"),
            name: this.f.agentName.value,
            maxContractAmount: {
                value: this.f.maxContractAmount.value,
                unit: this.f.maxContractAmountUnit.value
            },
            minFulfillmentTime: {
                value: this.f.minFulfillmentTime.value,
                unit: this.f.minFulfillmentTimeUnit.value
            },
            maxFulfillmentTime: {
                value: this.f.maxFulfillmentTime.value,
                unit: this.f.maxFulfillmentTimeUnit.value
            },
            maxVolume: {
                value: this.f.maxVolume.value,
                unit: this.f.maxVolumeUnit.value
            },
            maxNoOneToOne: {
                value: this.f.maxNoOneToOne.value,
                unit: this.f.maxNoOneToOneUnit.value
            },
            productNames: this.f.productNames.value.split(";"),
            maxNoContractPerDay: this.f.maxNoContractPerDay.value,
        };
        this.agentService.createSellingAgent(sellingAgentData).then((res) => {
            this.showCreateSellingAgent = false;
            Swal.fire({
                title: 'Success!',
                showConfirmButton: false,
                timer: 2000,
                text: 'The agent has been created!',
                icon: 'success',
            });
        }).catch((err) => {
            Swal.fire({
                title: 'Failed!',
                showConfirmButton: false,
                timer: 2000,
                text: 'Failed to create the selling agent!',
                icon: 'error',
            });
        })
    }

    onSelectTab(event: any, id: any) {
        event.preventDefault();
        this.selectedTab = id;
    }

    save(model: FormGroup) {

    }

    createSellingAgent(){
        this.showCreateSellingAgent = true;
    }

    createBuyingAgent(){
        this.showCreateBuyingAgent = true;
    }

    openModal(content) {
        this.modalService.open(content);
    }

    closeModal(id: string) {
        this.modalService.dismissAll();
    }

    // Getter method to access formcontrols
    get currency() {
        return this.sellingAgentForm.get('currency');
    }

    showTransactionsView(agentName: string){
        this.showTransactions = true;
        this.selectedAgent = agentName;
    }

    viewAgentList(){
        this.showTransactions = false;
    }

    closeSellingAgent() {
        this.showCreateSellingAgent = false
    }

    activateBA(id) {
        this.agentService.activateBuyingAgent({agentID: id});
    }

    deactivateBA(id) {
        this.agentService.deactivateBuyingAgent({agentID: id});
    }

    activateSA(id) {
        this.agentService.activateSellingAgent({agentID: id});
    }

    deactivateSA(id) {
        this.agentService.deactivateSellingAgent({agentID: id});
    }
}
