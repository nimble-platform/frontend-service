import 'rxjs/add/operator/switchMap';
import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, ParamMap} from '@angular/router';
import {Location} from '@angular/common';

import {BP} from './model/bp';
import {BPService} from './bp.service';
import {ProcessConfiguration} from './model/process-configuration';
import {TransactionConfiguration} from './model/transaction-configuration';
import {ExecutionConfiguration} from './model/execution-configuration';

import {ExternalDiagram} from './lib/external-diagram';

declare var jQuery: any;

@Component({
    selector: 'bp-configure',
    templateUrl: './bp-configure.component.html'
})
export class BPConfigureComponent implements OnInit {
    bp: BP;
    configuration: ProcessConfiguration;
    diagram: ExternalDiagram;

    selectedTransactionID: string;

    dataAdapterURI: string;
    dataChannelURI: string;
    dataProcessorURI: string;
    dataAdapterType: string;
    dataChannelType: string;
    dataProcessorType: string;

    partnerID: string;
    partnerRole: string;

    startSelecting: boolean;

    constructor(private bpService: BPService,
                private route: ActivatedRoute,
                private location: Location) {
        this.partnerID = 'buyer1387';
        this.partnerRole = '';
        this.configuration = new ProcessConfiguration(this.partnerID, this.partnerRole, '', []);
        this.selectedTransactionID = '';
        this.startSelecting = false;
    }

    ngOnInit(): void {
        this.route.paramMap
            .switchMap((params: ParamMap) => this.bpService.getBP(params.get('processID')))
            .subscribe(bp => this.bp = bp);
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.diagram = new ExternalDiagram();
            this.diagram.draw_static_diagram(this.bp.textContent);
        }, 500);

        setTimeout(() => {
            jQuery('.actor').hover(this.mouse_enter_actor_function, this.mouse_exit_actor_function);

            jQuery('.signal').hover(this.mouse_enter_signal_function, this.mouse_exit_signal_function);

            jQuery('.actor').click('click', (event) => {
                let element = event.target as SVGElement;
                let roleName = '';

                if (element.tagName === 'path') {
                    let tspanElement = element.parentElement.getElementsByTagName('tspan')[0] as SVGElement;
                    roleName = tspanElement.textContent;
                } else if (element.tagName === 'tspan') {
                    roleName = element.textContent;
                }
                this.partnerRole = roleName.toUpperCase();
                // Now handle all the actor boxes
                let svgElement = element.ownerSVGElement;
                let groupElements = svgElement.getElementsByTagName('g');
                for (let i = 0; i < groupElements.length; i++) {
                    let gElement = groupElements.item(i);
                    if (gElement.getAttribute('class') !== 'actor') {
                        continue;
                    }
                    let tspanElement = gElement.getElementsByTagName('tspan')[0] as SVGElement;
                    let pathElement = gElement.getElementsByTagName('path')[0] as SVGElement;
                    if (tspanElement.textContent === roleName) {
                        if (pathElement.style.fill !== 'gray') {
                            pathElement.style.fill = 'gray';
                        } else {
                            pathElement.style.fill = 'white';
                            this.partnerRole = '';
                        }
                    } else {
                        pathElement.style.fill = 'white';
                    }
                }
                //console.log(' $$$ Partner role: ', this.partnerRole);

                this.route.paramMap
                    .switchMap((params: ParamMap) => this.bpService.getConfiguration(this.partnerID, params.get('processID'), this.partnerRole))
                    .subscribe(configuration => {
                        this.configuration = configuration;
                        //console.log(' $$$ Retrieved configuration: ', this.configuration);
                        if (this.selectedTransactionID !== '') {
                            this.onSelect();
                        }
                    } );
            });

            jQuery('.signal').on('click', (event) => {
                let element = event.target as SVGElement;
                let transactionID = '';
                if (element.tagName === 'tspan') {
                    transactionID = element.textContent;
                } else if (element.tagName === 'path') {
                    let tspanElement = element.previousElementSibling.getElementsByTagName('tspan')[0] as SVGElement;
                    transactionID = tspanElement.textContent;
                }
                this.selectedTransactionID = transactionID.toUpperCase().replace(/\s/g, '');
                // now handle the rest of the transactions
                let svgElement = element.ownerSVGElement;
                let groupElements = svgElement.getElementsByTagName('g');
                for (let i = 0; i < groupElements.length; i++) {
                    let gElement = groupElements.item(i);
                    if (gElement.getAttribute('class') !== 'signal') {
                        continue;
                    }
                    let tspanElement = gElement.getElementsByTagName('tspan')[0] as SVGElement;
                    let pathElement = gElement.getElementsByTagName('path')[0] as SVGElement;
                    if (tspanElement.textContent === transactionID) {
                        if (pathElement.style.stroke !== 'maroon') {
                            pathElement.style.stroke = 'maroon';
                            tspanElement.style.fill = 'maroon';
                        } else {
                            pathElement.style.stroke = 'black';
                            tspanElement.style.fill = 'black';
                            this.selectedTransactionID = '';
                        }
                    } else {
                        pathElement.style.stroke = 'black';
                        tspanElement.style.fill = 'black';
                    }
                }

                //console.log(' $$$ Transaction ID ', this.selectedTransactionID);
                this.onSelect();
            });

            this.startSelecting = true;
        }, 3000);
    }

    onSelect(): void {
        this.dataAdapterURI = '';
        this.dataAdapterType = '';
        this.dataProcessorURI = '';
        this.dataProcessorType = '';
        this.dataChannelURI = '';
        this.dataChannelType = '';

        if (this.configuration != null && this.configuration.transactionConfigurations != null) {

            for (let t of this.configuration.transactionConfigurations) {
                if (this.selectedTransactionID === t.transactionID) {
                    let executionConfigurations = t.executionConfigurations;

                    for (let ec of executionConfigurations) {
                        if (ec.applicationType === 'DATAADAPTER') {
                            this.dataAdapterURI = ec.executionUri;
                            this.dataAdapterType = ec.executionType;
                        } else if (ec.applicationType === 'DATAPROCESSOR') {
                            this.dataProcessorURI = ec.executionUri;
                            this.dataProcessorType = ec.executionType;
                        } else if (ec.applicationType === 'DATACHANNEL') {
                            this.dataChannelURI = ec.executionUri;
                            this.dataChannelType = ec.executionType;
                        }
                    }
                }
            }

        }
    }

    configure(): void {
        this.configuration.partnerID = this.partnerID;
        this.configuration.processID = this.bp.processID;
        this.configuration.roleType = this.partnerRole;

        let transactionConfiguration = new TransactionConfiguration(this.selectedTransactionID, []);
        let dataAdapterExecutionConfiguration = new ExecutionConfiguration('DATAADAPTER',
            this.dataAdapterType, this.dataAdapterURI);
        transactionConfiguration.executionConfigurations.push(dataAdapterExecutionConfiguration);
        let dataProcessorExecutionConfiguration = new ExecutionConfiguration('DATAPROCESSOR',
            this.dataProcessorType, this.dataProcessorURI);
        transactionConfiguration.executionConfigurations.push(dataProcessorExecutionConfiguration);
        let dataChannelExecutionConfiguration = new ExecutionConfiguration('DATACHANNEL',
            this.dataChannelType, this.dataChannelURI);
        transactionConfiguration.executionConfigurations.push(dataChannelExecutionConfiguration);

        //console.log(' $$$ Constructed TransactionConfiguration: ', transactionConfiguration);
        //console.log(' $$$ Existing TransactionConfigurations: ', this.configuration.transactionConfigurations);

        if (this.configuration.transactionConfigurations != null && this.configuration.transactionConfigurations.length > 0) {
            let found = false;
            for (let t of this.configuration.transactionConfigurations) {
                if (this.selectedTransactionID === t.transactionID) {
                    let index = this.configuration.transactionConfigurations.indexOf(t);
                    this.configuration.transactionConfigurations[index] = transactionConfiguration;
                    found = true;
                }

                if (!found) {
                    this.configuration.transactionConfigurations.push(transactionConfiguration);
                }
            }
        } else {
            this.configuration.transactionConfigurations.push(transactionConfiguration);
        }
        //console.log(' $$$ TransactionConfigurations after processing: ', this.configuration.transactionConfigurations);

        this.bpService.updateConfiguration(this.configuration)
            .subscribe(() => {
            });
    }

    goBack(): void {
        this.location.back();
    }

    mouse_enter_actor_function(event: MouseEvent): void {
        let element = event.target as SVGElement;
        if (element.tagName === 'path') {
            if (element.style.fill !== 'gray') {
                element.style.fill = 'lightgray';
            }
        }
    }

    mouse_exit_actor_function(event: MouseEvent): void {
        let element = event.target as SVGElement;
        if (element.tagName === 'path') {
            if (element.style.fill === 'lightgray') {
                element.style.fill = 'white';
            }
        }
    }

    mouse_enter_signal_function(event: MouseEvent): void {
        let element = event.target as SVGElement;
        if (element.tagName === 'tspan') {
            if (element.style.fill !== 'maroon') {
                element.style.fill = 'crimson';
                let pathElement = element.parentElement.nextElementSibling as SVGPathElement;
                pathElement.style.stroke = 'crimson';
            }
        } else if (element.tagName === 'path') {
            if (element.style.stroke !== 'maroon') {
                element.style.stroke = 'crimson';
                let tspanElement = element.previousElementSibling.getElementsByTagName('tspan')[0] as SVGElement;
                tspanElement.style.fill = 'crimson';
            }
        }
    }

    mouse_exit_signal_function(event: MouseEvent): void {
        let element = event.target as SVGElement;
        if (element.tagName === 'tspan') {
            if (element.style.fill === 'crimson') {
                element.style.fill = 'black';
                let pathElement = element.parentElement.nextElementSibling as SVGPathElement;
                pathElement.style.stroke = 'black';
            }
        } else if (element.tagName === 'path') {
            if (element.style.stroke === 'crimson') {
                element.style.stroke = 'black';
                let tspanElement = element.previousElementSibling.getElementsByTagName('tspan')[0] as SVGElement;
                tspanElement.style.fill = 'black';
            }
        }
    }
}
