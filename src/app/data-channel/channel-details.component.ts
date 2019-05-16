import 'rxjs/add/operator/switchMap';
import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, ParamMap, Router} from '@angular/router';
import {DataChannelService} from "./data-channel.service";
import {Machine} from "./model/machine";
import {Sensor} from "./model/sensor";
import {Server} from "./model/server";

class NewServer {
    constructor(
        public priority: string,
        public name: string,
        public address: string,
        public duration: string,
        public ownership: string,
        public login: string,
        public loginPW: string,
        public description: string
    ) {
    }
}

class NewSensor {
    constructor(
        public name: string,
        public interval: number,
        public description: string,
        public dataKey: string,
        public metadata: string,
        public advancedFiltering: string,
        public machineName: string
    ) {
    }
}

class AdditionalSettings {
    constructor(
        public additionalNotes: string,
        public hostRequest: boolean,
        public serviceType: string
    ) {
    }
}

//-------------------------------------------------------------------------------------
// Component
//-------------------------------------------------------------------------------------
@Component({
    selector: 'channel-details',
    templateUrl: './channel-details.component.html',
    styleUrls: ['./channel-details.component.css']
})
export class ChannelDetailsComponent implements OnInit {

    private SERVICE_TYPES: string[] = ["MongoDB", "Oracle", "Mqtt", "Kafka"]
    private sellerMessage: string = '';
    private buyerMessage: string = '';
    private pageNumber: number = 0;
    hasInternalService: boolean = false;
    hasFilteringService: boolean = false;
    displayStorageArea: boolean = true;

    channelConfig: object = {};
    channelMessages: object[] = [];

    initialChannelServers: object[] = [];
    counterChannelServers: object[] = [];

    initialChannelSensors: object[] = [];
    counterChannelSensors: object[] = [];

    private initialSettings: AdditionalSettings = new AdditionalSettings("Info", false, 'MongoDB');
    private counterSettings: AdditionalSettings = new AdditionalSettings("Info", false, 'MongoDB');

    private newServer: NewServer = new NewServer(null, null, null, null, null, null, null, null);
    private newSensor: NewSensor = new NewSensor(null, null, null, null, null, null, null);


    //-------------------------------------------------------------------------------------
    // CTOR
    //-------------------------------------------------------------------------------------
    constructor(
        private route: ActivatedRoute,
        private dataChannelService: DataChannelService,
        private router: Router
    ) {}

    //-------------------------------------------------------------------------------------
    // ngOnInit to update
    //-------------------------------------------------------------------------------------
    ngOnInit(): void {
        this.update();
    }

    //-------------------------------------------------------------------------------------
    // update
    //-------------------------------------------------------------------------------------
    update(): void {

        const channelID = this.route.snapshot.params['channelID'];

        // get metadata of channel
        this.dataChannelService.getChannelConfig(channelID)
            .then(channelConfig => {
                this.channelConfig = channelConfig;
                this.pageNumber = channelConfig.negotiationStepcounter % 5;
                this.sellerMessage = channelConfig.negotiationSellerMessages;
                this.buyerMessage = channelConfig.negotiationBuyerMessages;

                if(this.pageNumber > 1)
                {
                    //get relevant step data
                    this.dataChannelService.getChannelConfigFromNegotiationStep(channelID, this.pageNumber-2)
                        .then(initialChannelConfig => {

                            this.initialChannelSensors = initialChannelConfig.associatedSensors;
                            this.initialChannelServers = initialChannelConfig.associatedServers;
                            this.initialSettings.serviceType = initialChannelConfig.privateServersType;
                            this.initialSettings.hostRequest = initialChannelConfig.hostRequest;
                            this.initialSettings.additionalNotes = initialChannelConfig.additionalNotes;
                       })
                       .catch(() => {
                           alert("Error while doing getting historic step");
                       });

                    //get relevant step data
                    this.dataChannelService.getChannelConfigFromNegotiationStep(channelID, this.pageNumber-1)
                        .then(counterChannelConfig => {

                            this.counterChannelSensors = counterChannelConfig.associatedSensors;
                            this.counterChannelServers = counterChannelConfig.associatedServers;
                            this.counterSettings.serviceType = counterChannelConfig.privateServersType;
                            this.counterSettings.hostRequest = counterChannelConfig.hostRequest;
                            this.counterSettings.additionalNotes = counterChannelConfig.additionalNotes;
                       })
                       .catch(() => {
                           alert("Error while doing getting historic step");
                       });
                }
                else
                {
                        // get sensors
                        this.dataChannelService.getAssociatedSensors(channelID)
                            .then(sensors => {
                                this.initialChannelSensors = sensors;
                                this.counterChannelSensors = sensors;
                            });

                        // get servers
                        this.dataChannelService.getAssociatedServers(channelID)
                            .then(servers => {
                                this.initialChannelServers = servers;
                                this.counterChannelServers = servers;
                            });
                }
            })
            .catch(() => {
                alert("Error while getting channel config");
            });


        // get setup internal service boolean
        this.dataChannelService.getInternalService()
             .then(bInternalService => {
                 this.hasInternalService = bInternalService;
             });

        // get setup filtering service boolean
        this.dataChannelService.getFilteringService()
             .then(bFilteringService => {
                 this.hasFilteringService = bFilteringService;
             });
    }

    //-------------------------------------------------------------------------------------
    // switch page visualisation left and right
    //-------------------------------------------------------------------------------------
    getPresentationModeLeft(): string
    {
        if(this.pageNumber == 0)
           return "edit";
        else
           return "view";
    }
    getPresentationModeRight(): string
    {
        if(this.pageNumber == 1)
           return "edit";
        else
           return "view";
    }

    //-------------------------------------------------------------------------------------
    // handle negotiation steps
    //-------------------------------------------------------------------------------------
    getCurrentNegotiationStep(step: number): any {
        if(step === this.pageNumber) {
            const result: any = {
                step: true,
                current: true
            };
            return result;
        }
        return { step: true }
    }

    //-------------------------------------------------------------------------------------
    // confirm current page
    //-------------------------------------------------------------------------------------
    confirmPage(): void {

       const channelId = this.channelConfig["channelID"];

       if(this.pageNumber == 0)
       {
           this.dataChannelService.setAdvancedConfig(channelId, this.displayStorageArea,
                                                     this.initialSettings.additionalNotes,
                                                     this.initialSettings.serviceType,
                                                     this.initialSettings.hostRequest)
               .then(() => {
                   location.reload();
               })
               .catch(() => {
                   alert("Error while setting advanced config");
               });
       }
       else if(this.pageNumber == 1)
       {
             this.dataChannelService.setAdvancedConfig(channelId, this.displayStorageArea,
                                                       this.counterSettings.additionalNotes,
                                                       this.counterSettings.serviceType,
                                                       this.counterSettings.hostRequest)
                 .then(() => {
                     location.reload();
                 })
                 .catch(() => {
                     alert("Error while setting advanced config");
                 });
       }

       this.dataChannelService.doNegotiationStep(channelId, this.sellerMessage, this.buyerMessage)
           .then(() => {
               location.reload();
           })
           .catch(() => {
               alert("Error while doing a negotiation step");
           });
    }

    //-------------------------------------------------------------------------------------
    // renegotiate
    //-------------------------------------------------------------------------------------
    renegotiateTerms(numberOfSteps:number): void {

       const channelId = this.channelConfig["channelID"];
       this.dataChannelService.renegotiate(channelId, numberOfSteps)
           .then(() => {
               location.reload();
           })
           .catch(() => {
               alert("Error while doing a negotiation step");
           });
    }

    //-------------------------------------------------------------------------------------
    // open a channel
    //-------------------------------------------------------------------------------------
    openChannel(): void {
        const channelId = this.channelConfig["channelID"];
        this.dataChannelService.startChannel(channelId)
            .then(() => {
                location.reload();
                alert("Opened Channel");
                //this.router.navigate(["dashboard"]);
            })
            .catch(() => {
                alert("Error while opening channel");
            });
    }

    //-------------------------------------------------------------------------------------
    // close a channel
    //-------------------------------------------------------------------------------------
    closeChannel(): void {
        const channelId = this.channelConfig["channelID"];
        this.dataChannelService.closeChannel(channelId)
            .then(() => {
                location.reload();
                alert("Closed Channel");
                //this.router.navigate(["dashboard"]);
            })
            .catch(() => {
                alert("Error while closing channel");
            });
    }

    //-------------------------------------------------------------------------------------
    // add a private DB server
    //-------------------------------------------------------------------------------------
    addServer(): void {
       const server = new Server(this.newServer.priority, this.newServer.name, this.newServer.address,
                                 this.newServer.duration, this.newServer.ownership,
                                 this.newServer.login, this.newServer.loginPW, this.newServer.description);

       // add to backend
       const channelId = this.channelConfig["channelID"];
       this.dataChannelService.addServersForChannel(channelId, server)
            .then(addedServer => {
                this.update();
            })
            .catch(() => {
                alert("Error while adding server");
            });
    }

    //-------------------------------------------------------------------------------------
    // remove a private DB server
    //-------------------------------------------------------------------------------------
    removeServer(server: Server): void {
       const channelId = this.channelConfig["channelID"];

       this.dataChannelService.removeServerForChannel(channelId, server)
           .then( () => {
               this.update();
           })
           .catch( () => {
               this.update();
           });
    }

    //-------------------------------------------------------------------------------------
    // add a sensor
    //-------------------------------------------------------------------------------------
    addSensor(): void {

        if(!this.hasFilteringService)
        {
           this.newSensor.dataKey = "not installed";
           this.newSensor.metadata = "not installed";
           this.newSensor.advancedFiltering = "not installed";
        }

        // create sensor locally
        const machine = new Machine(this.newSensor.machineName, null, null);
        const sensor = new Sensor(this.newSensor.name, this.newSensor.interval, this.newSensor.description,
                                  this.newSensor.dataKey, this.newSensor.metadata, this.newSensor.advancedFiltering,
                                  machine);

        // add to backend
        const channelId = this.channelConfig["channelID"];
        this.dataChannelService.addSensor(channelId, sensor)
            .then(addedSensor => {
                this.update();
            })
            .catch(() => {
                alert("Error while adding sensor");
            });
    }

    //-------------------------------------------------------------------------------------
    // remove a sensor
    //-------------------------------------------------------------------------------------
    removeSensor(sensor: Sensor) : void {
        const channelId = this.channelConfig["channelID"];

        this.dataChannelService.removeSensor(channelId, sensor)
            .then( () => {
                this.update();
            })
            .catch( () => {
                this.update();
            });
    }
}
