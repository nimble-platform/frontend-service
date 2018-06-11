import 'rxjs/add/operator/switchMap';
import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, ParamMap, Router} from '@angular/router';
import {DataChannelService} from "./data-channel.service";

@Component({
    selector: 'channel-details',
    templateUrl: './channel-details.component.html',
    styleUrls: ['./channel-details.component.css']
})
export class ChannelDetailsComponent implements OnInit {

    channelConfig: object = {};
    channelMessages: object[] = [];

    constructor(
        private route: ActivatedRoute,
        private dataChannelService: DataChannelService,
        private router: Router
    ) {}

    ngOnInit(): void {
        const channelID = this.route.snapshot.params['channelID'];

        // get metadata of channel
        this.dataChannelService.getChannelConfig(channelID)
            .then(channelConfig => {
                this.channelConfig = channelConfig;
            });

        // get messages of channels
        this.dataChannelService.getChannelMessages(channelID)
            .then(messages => {
                this.channelMessages = messages.map(JSON.parse);
            })
    }

    deleteChannel(): void {
        const channelId = this.channelConfig["channelID"];
        this.dataChannelService.deleteChannel(channelId)
            .then( () => {
                alert("Deleted Channel");
                this.router.navigate(["dashboard"]);
            })
            .catch(() => {
                alert("Error while deleting channel");
            });
    }
}
