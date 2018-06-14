import 'rxjs/add/operator/switchMap';
import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, ParamMap, Router} from '@angular/router';
import {DataChannelService} from "./data-channel.service";
import {Machine} from "./model/machine";
import {Sensor} from "./model/sensor";

class NewSensor {
    constructor(
        public name: string,
        public description: string,
        public machineName: string
    ) {
    }
}

@Component({
    selector: 'channel-details',
    templateUrl: './channel-details.component.html',
    styleUrls: ['./channel-details.component.css']
})
export class ChannelDetailsComponent implements OnInit {

    channelConfig: object = {};
    channelMessages: object[] = [];
    channelSensors: object[] = [];
    private newSensor: NewSensor = new NewSensor(null, null, null);

    constructor(
        private route: ActivatedRoute,
        private dataChannelService: DataChannelService,
        private router: Router
    ) {
    }

    ngOnInit(): void {
        this.update();
    }

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
        this.dataChannelService.getChannelMessages(channelID)
            .then(messages => {
                this.channelMessages = messages.map(JSON.parse);
            });
    }

    deleteChannel(): void {
        const channelId = this.channelConfig["channelID"];
        this.dataChannelService.deleteChannel(channelId)
            .then(() => {
                alert("Deleted Channel");
                this.router.navigate(["dashboard"]);
            })
            .catch(() => {
                alert("Error while deleting channel");
            });
    }

    addSensor(): void {
        // create sensor locally
        const machine = new Machine(this.newSensor.machineName, null, null);
        const sensor = new Sensor(this.newSensor.name, this.newSensor.description, machine);

        // add to backend
        const channelId = this.channelConfig["channelID"];
        this.dataChannelService.addSensor(channelId, sensor)
            .then( addedSensor => {
                this.update();
            })
            .catch(() => {
                alert("Error while adding sensor");
            });
    }

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
