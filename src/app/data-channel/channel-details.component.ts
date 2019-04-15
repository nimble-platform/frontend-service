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
        public machineName: string
    ) {
    }
}

class AdditionalSettings {
    constructor(
        public notes: string,
        public hostrequest: boolean,
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

    channelConfig: object = {};
    channelMessages: object[] = [];
    channelServers: object[] = [];
    channelSensors: object[] = [];

    displayStorageArea: boolean = true;
    private newServer: NewServer = new NewServer(null, null, null, null, null, null, null, null);
    private newSensor: NewSensor = new NewSensor(null, null, null, null);
    private initialSettings: AdditionalSettings = new AdditionalSettings("Info", false, 'MongoDB');
    private counterSettings: AdditionalSettings = new AdditionalSettings("Info", false, 'MongoDB');

    private SERVICE_TYPES: string[] = ["MongoDB", "Oracle", "Mqtt", "Kafka"]


    private pageNumber: number = 0; // Todo: needs to be changed after testing to get info from backend
    public incrementPageNrTest()    // Todo: instead get info from backend (data available? -> load 2nd design)
    {
      if(this.pageNumber<3)
      {
        this.pageNumber++;
      }
      else
      {
        this.pageNumber=0;
      }
    }


    //-------------------------------------------------------------------------------------
    // CTOR
    //-------------------------------------------------------------------------------------
    constructor(
        private route: ActivatedRoute,
        private dataChannelService: DataChannelService,
        private router: Router
    ) {
    }

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
            });

        // get sensors
        this.dataChannelService.getAssociatedSensors(channelID)
            .then(sensors => {
                this.channelSensors = sensors;
            });

        // get messages of channels
        //this.dataChannelService.getChannelMessages(channelID)
        //    .then(messages => {
        //        this.channelMessages = messages.map(JSON.parse);
        //    });
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
    // create/open a channel
    //-------------------------------------------------------------------------------------
    createChannel(): void {
        const channelId = this.channelConfig["channelID"];
        this.dataChannelService.startChannel(channelId)
            .then(() => {
                alert("Deleted Channel");
                this.router.navigate(["dashboard"]);
            })
            .catch(() => {
                alert("Error while deleting channel");
            });
    }

    //-------------------------------------------------------------------------------------
    // delete/close a channel
    //-------------------------------------------------------------------------------------
    deleteChannel(): void {
        const channelId = this.channelConfig["channelID"];
        this.dataChannelService.closeChannel(channelId)
            .then(() => {
                alert("Deleted Channel");
                this.router.navigate(["dashboard"]);
            })
            .catch(() => {
                alert("Error while deleting channel");
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
        // create sensor locally
        const machine = new Machine(this.newSensor.machineName, null, null);
        const sensor = new Sensor(this.newSensor.name, this.newSensor.interval, this.newSensor.description, machine);

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
