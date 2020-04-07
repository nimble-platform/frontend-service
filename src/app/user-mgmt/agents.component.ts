/*
 * Copyright 2020
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

import {Component, OnInit, TemplateRef, ViewChild} from "@angular/core";
import { UserService } from './user.service';
import { CookieService } from 'ng2-cookies';
import { CallStatus } from '../common/call-status';
import {TranslateService} from '@ngx-translate/core';
import { Router } from "@angular/router";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {AgentService} from "./agent.service";
import Swal from 'sweetalert2';
import * as _ from 'underscore';

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
    isDev= false;

    saErr = false;
    baErr = false;

    SELLING_AGENT = 'SELLING_AGENT';
    BUYING_AGENT = 'BUYING_AGENT';

    @ViewChild('buyingAgentModal') buyingAgentModal : TemplateRef<any>; // Note: TemplateRef
    @ViewChild('sellingAgentModal') sellingAgentModal : TemplateRef<any>; // Note: TemplateRef

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
            id: [''],
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
            id: [''],
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

        this.refreshAgents();
    }


    refreshAgents() {
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
        let agent = this.getSellingAgent(id);
        this.sellingAgentForm.get("id").setValue(agent.id);
        this.sellingAgentForm.get("agentName").setValue(agent.agentName);
        this.sellingAgentForm.get("maxContractAmount").setValue(Number(agent.maxContractAmount.value));
        this.sellingAgentForm.get("maxContractAmountUnit").setValue(agent.maxContractAmount.unit);
        this.sellingAgentForm.get("minFulfillmentTime").setValue(Number(agent.minFulfillmentTime.value));
        this.sellingAgentForm.get("minFulfillmentTimeUnit").setValue(agent.minFulfillmentTime.unit);
        this.sellingAgentForm.get("maxFulfillmentTime").setValue(Number(agent.maxFulfillmentTime.value));
        this.sellingAgentForm.get("maxFulfillmentTimeUnit").setValue(agent.maxFulfillmentTime.unit);
        this.sellingAgentForm.get("maxVolume").setValue(Number(agent.maxVolume.value));
        this.sellingAgentForm.get("maxVolumeUnit").setValue(agent.maxVolume.unit);
        this.sellingAgentForm.get("maxNoOneToOne").setValue(Number(agent.maxNoOneToOne.value));
        this.sellingAgentForm.get("maxNoOneToOneUnit").setValue(agent.maxNoOneToOne.unit);
        this.sellingAgentForm.get("productNames").setValue(agent.productNames.join(';'));
        this.sellingAgentForm.get("maxNoContractPerDay").setValue(Number(agent.maxNoContractPerDay));
        // show the create form
        this.showCreateSellingAgent = true;
        this.modalService.open(this.sellingAgentModal);
    }

    editBuyingAgent(id) {
        let agent = this.getBuyingAgent(id);
        this.buyingAgentForm.get("id").setValue(agent.id);
        this.buyingAgentForm.get("agentName").setValue(agent.agentName);
        this.buyingAgentForm.get("maxContractAmount").setValue(Number(agent.maxContractAmount.value));
        this.buyingAgentForm.get("maxContractAmountUnit").setValue(agent.maxContractAmount.unit);
        this.buyingAgentForm.get("minFulfillmentTime").setValue(Number(agent.minFulfillmentTime.value));
        this.buyingAgentForm.get("minFulfillmentTimeUnit").setValue(agent.minFulfillmentTime.unit);
        this.buyingAgentForm.get("maxFulfillmentTime").setValue(Number(agent.maxFulfillmentTime.value));
        this.buyingAgentForm.get("maxFulfillmentTimeUnit").setValue(agent.maxFulfillmentTime.unit);
        this.buyingAgentForm.get("maxVolume").setValue(Number(agent.maxVolume.value));
        this.buyingAgentForm.get("maxVolumeUnit").setValue(agent.maxVolume.unit);
        this.buyingAgentForm.get("maxNoOneToOne").setValue(Number(agent.maxNoOneToOne.value));
        this.buyingAgentForm.get("maxNoOneToOneUnit").setValue(agent.maxNoOneToOne.unit);
        this.buyingAgentForm.get("productNames").setValue(agent.productNames.join(';'));
        this.buyingAgentForm.get("maxNoContractPerDay").setValue(agent.maxNoContractPerDay);
        // show the create form
        this.showCreateBuyingAgent = true;
        this.modalService.open(this.buyingAgentModal);
    }

    getAllSellingAgents(){
        this.agentService.getAllSellingAgents().then((data) => {
            this.agentList = data;
            if(data.length == 0){
                this.showEmptyPageSA = true;
            }

        }).catch(err => {
            this.showEmptyPageSA = true;
            this.saErr = true;
        });
    }

    getAllBuyingAgents(){
        this.agentService.getAllBuyingAgents().then((data) => {
            this.buyingAgentList = data;
            if(data.length == 0){
                this.showEmptyPageBA = true;
            }
        }).catch(err => {
            this.showEmptyPageBA = true;
            this.baErr = true;
        });
    }

    submitBuyingAgent() {
        let buyingAgentData = {
            id: '',
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

        // If an id is avaiable for the agent update the agent
        if (this.form.id.value != null && this.form.id.value.trim() != '') {
            buyingAgentData.id = this.form.id.value;
            this.agentService.updateBuyingAgent(buyingAgentData).then((res) => {
                this.showCreateBuyingAgent = false;
                this.getAllBuyingAgents();
                this.showSuccessAlert('Agent has been successfully updated!');
            }).catch((err) => {
                this.showFailureAlert('Failed to update the agent!');
            }).then(() => {
                this.closeModal();
            })
        }else{
            // create a new agent
            this.agentService.createBuyingAgent(buyingAgentData).then((res) => {
                this.showCreateBuyingAgent = false;
                this.showEmptyPageBA = false;
                this.getAllBuyingAgents();
                this.showSuccessAlert('The agent has been created!');
            }).catch((err) => {
                this.showFailureAlert('Failed to create the buying agent!');
            }).then(() => {
                this.closeModal();
            })
        }
    }

    showSuccessAlert(text) {
        Swal.fire({
            title: 'Success!',
            showConfirmButton: false,
            timer: 2000,
            text: text,
            icon: 'success',
        });
    }

    showFailureAlert(text) {
        Swal.fire({
            title: 'Failed!',
            showConfirmButton: false,
            timer: 2000,
            text: text,
            icon: 'error',
        });
    }

    submitSellingAgent(){
        let sellingAgentData = {
            id: '',
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

        // If an id is avaiable for the agent update the agent
        if (this.f.id.value != null && this.f.id.value.trim() != '') {
            sellingAgentData.id = this.f.id.value;
            this.agentService.updateSellingAgent(sellingAgentData).then((res) => {
                this.showCreateBuyingAgent = false;
                this.getAllSellingAgents();
                this.showSuccessAlert('Agent has been successfully updated!');
            }).catch((err) => {
                this.showFailureAlert('Failed to update the agent!');
            }).then(() => {
                this.closeModal();
            })
        }else{
            // create a new agent
            this.agentService.createBuyingAgent(sellingAgentData).then((res) => {
                this.showCreateBuyingAgent = false;
                this.showEmptyPageSA = false;
                this.getAllSellingAgents();
                this.showSuccessAlert('The agent has been created!');
            }).catch((err) => {
                this.showFailureAlert('Failed to create the buying agent!');
            }).then(() => {
                this.closeModal();
            })
        }
    }

    onSelectTab(event: any, id: any) {
        event.preventDefault();
        this.selectedTab = id;
    }

    createSellingAgent(){
        this.showCreateSellingAgent = true;
        // TODO remove after testing
        if (this.isDev) {
            this.editSellingAgent('123');
        }
    }

    createBuyingAgent(){
        this.showCreateBuyingAgent = true;
        // TODO remove after testing
        if (this.isDev) {
            this.editBuyingAgent('123');
        }
    }

    openModal(content) {
        this.modalService.open(content);
    }

    closeModal() {
        this.modalService.dismissAll();
    }

    showTransactionsView(agentID){
        this.orders = [];
        this.agentService.getSAOrders(agentID).then((datas) => {
            datas.forEach((data) => {
                data = data['payload'];
                let dateObj = data['processData']['creationDate'].split('T');
                let date = dateObj[0];
                let time = dateObj[1].split('.')[0];

                let dateStr = `${date} (${time})`
                let saOrder = {
                    productName: data['orderLine'][0]['lineItem']['item']['name'][0]['value'],
                    units: data['orderLine'][0]['lineItem']['quantity']['value'],
                    price: data['anticipatedMonetaryTotal']['payableAmount']['value'],
                    companyName: data['sellerSupplierParty']['party']['partyName'][0]['name']['value'],
                    date: dateStr,
                    status: data['processData']['status'],
                    processInstanceID: data['processData']['processInstanceID']
                };

                this.orders.push(saOrder);
            });

            this.selectedAgent = this.getSellingAgent(agentID)['agentName'];
            this.showTransactions = true;
        });
    }

    navigateToProcess(processInstanceID) {
        this.router.navigate([`bpe/bpe-exec/${processInstanceID}/STAGING`]);
    }

    viewAgentList(){
        this.showTransactions = false;
    }

    closeSellingAgent() {
        this.showCreateSellingAgent = false
    }

    activateBA(id) {
        this.agentService.activateBuyingAgent({agentID: id}).then(() => {
            this.getAllBuyingAgents();
        });
    }

    deactivateBA(id) {
        this.agentService.deactivateBuyingAgent({agentID: id}).then(() => {
            this.getAllBuyingAgents();
        });
    }

    activateSA(id) {
        this.agentService.activateSellingAgent({agentID: id}).then(() => {
            this.getAllSellingAgents();
        });
    }

    deactivateSA(id) {
        this.agentService.deactivateSellingAgent({agentID: id}).then(() => {
            this.getAllSellingAgents();
        });
    }

    deleteAgent(id, agentType) {
        this.agentService.deleteAgent(id, agentType).then((data) => {
            if (agentType === this.SELLING_AGENT) {
                this.getAllSellingAgents();
            } else {
                this.getAllBuyingAgents();
            }
            Swal.fire({
                title: 'Success!',
                showConfirmButton: false,
                timer: 2000,
                text: 'Agent deleted successfuly!',
                icon: 'success',
            });
        }).catch((err) => {
            Swal.fire({
                title: 'Failed!',
                showConfirmButton: false,
                timer: 2000,
                text: 'Failed to delete the agent!',
                icon: 'error',
            });
        })
    }

    getSellingAgent(id) {

        let agent = _.find(this.agentList, function (agent) {
            return agent.id == id;
        });

        // TODO remove after testing
        if (this.isDev) {
            if (agent === undefined) {
                    agent = this.fillRandomForSA()

            }
        }
        return agent;
    }

    getBuyingAgent(id) {

        let agent = _.find(this.buyingAgentList, function (agent) {
            return agent.id == id;
        });

        // TODO remove after testing
        if (this.isDev) {
            if (agent === undefined) {
                agent = this.fillRandomForBA()
            }
        }
        return agent;
    }

    rand(length, current) {
        current = current ? current : '';
        return length ? this.rand(--length, "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz".charAt(Math.floor(Math.random() * 60)) + current) : current;
    }

    getRandomInt(max) {
        return Math.floor(Math.random() * Math.floor(max));
    }

    fillRandomForSA(){
        return {
            agentName: this.rand(5, null) + ' agent',
            maxContractAmount: {value: this.getRandomInt(30000), unit: 'euro'},
            minFulfillmentTime: {value: this.getRandomInt(10), unit: 'hour'},
            maxFulfillmentTime: {value: this.getRandomInt(20), unit: 'day'},
            maxVolume: {value: this.getRandomInt(50000), unit: 'day'},
            maxNoOneToOne: {value: this.getRandomInt(5), unit: 'week'},
            productNames: ['ff1c8a90-6248-494d-8d12-4292c7b40185'],
            maxNoContractPerDay: this.getRandomInt(5)
        };
    }

    fillRandomForBA(){
        return {
            agentName: this.rand(5, null) + ' agent',
            maxContractAmount: {value: this.getRandomInt(30000), unit: 'euro'},
            minFulfillmentTime: {value: this.getRandomInt(10), unit: 'hour'},
            maxFulfillmentTime: {value: this.getRandomInt(20), unit: 'day'},
            maxVolume: {value: this.getRandomInt(50000), unit: 'day'},
            maxNoOneToOne: {value: this.getRandomInt(5), unit: 'week'},
            productNames: ['ff1c8a90-6248-494d-8d12-4292c7b40185'],
            maxNoContractPerDay: this.getRandomInt(5)
        };
    }

}
