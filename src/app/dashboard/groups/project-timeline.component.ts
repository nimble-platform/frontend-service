import {Component, Input, OnInit, Output} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {DashboardQueryParameters} from '../model/dashboard-query-parameters';
import {CollaborationGroupResults} from '../model/collaboration-group-results';
import {CallStatus} from '../../common/call-status';
import {ProcessInstanceGroupFilter} from '../../bpe/model/process-instance-group-filter';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {BPEService} from '../../bpe/bpe.service';
import {CookieService} from 'ng2-cookies';
import {DashboardQuery} from '../model/dashboard-query';
import {FEDERATION, FEDERATIONID} from '../../catalogue/model/constants';
import {PAGE_SIZE, TABS} from '../constants';
import {AppComponent} from '../../app.component';
import {FederatedCollaborationGroupMetadata} from '../../bpe/model/federated-collaboration-group-metadata';
import * as myGlobals from '../../globals';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {CollaborationGroup} from '../../bpe/model/collaboration-group';
import {DashboardUser} from '../model/dashboard-user';
import * as d3 from 'd3';
import * as moment from 'moment';
@Component({
    selector: 'project-timeline',
    templateUrl: './project-timeline.component.html'
})
export class ProjectTimeline implements OnInit {
    @Input() collaborationGroup: any;
    data: any = [];
    expanded = false;
    finalArray = [];
    finalXAsxisArray = [];

    ngOnInit(): void {
        this.clickexpand()
    }

    clickexpand(){
        // if(this.selectedId != ""){
        //     this.data = [];
        //     this.chart = null;
        //     var idDiv = ".cls"+this.selectedId + " > svg";
        //     d3.select(idDiv).remove();
        // }
        // this.expanded = !this.expanded;
        let data = this.collaborationGroup;
        // this.isDivVisible = !this.isDivVisible;
        // this.selectedId = data.id;
        var t_arr = [];
        data.associatedProcessInstanceGroups.forEach(element => {
            var lastActivityTime = (new Date(element.lastActivityTime)).getTime();
            var firstActivityTime = (new Date(element.firstActivityTime)).getTime();
            if((new Date(element.lastActivityTime).getTime()) -(new Date(element.firstActivityTime).getTime()) < 86400000){
                firstActivityTime = new Date(element.firstActivityTime).getTime()-(86400000*1);
                lastActivityTime = (new Date(element.lastActivityTime)).getTime();
            }
            var obj =  { times: [{"color":"red", "label":element.name, "starting_time": firstActivityTime, "ending_time": lastActivityTime}]}
            t_arr.push((new Date(element.firstActivityTime)).getTime()/1000);
            t_arr.push((new Date(element.lastActivityTime)).getTime()/1000);
            this.data.push(obj);
        });
        this.data = this.data.sort(function(a,b){return a.times[0].starting_time - b.times[0].starting_time});
        var endDateSorted =  this.data.sort(function(a,b){return a.times[0].ending_time - b.times[0].ending_time});
        var projectDuration = endDateSorted[endDateSorted.length-1].times[0].ending_time-this.data[0].times[0].starting_time;
        var newArray = [];
        var arrayForXaxis= [];
        var itemid= 0;
        var colorcode = ['#ff4b66','#f36170','#e7727a','#d98185','#ca8e8f','#b99a9a','#a5a5a5'];
        var colorindex = 0;
        this.data.forEach(element => {
            var projectDurationPercetage = ((element.times[0].ending_time - element.times[0].starting_time)*700)/projectDuration;
            projectDuration = 700/this.data.length;
            var timeStampDate = new Date(element.times[0].ending_time);
            var timeLabel = moment.monthsShort(timeStampDate.getMonth())+ "/"+timeStampDate.getDate();
            var itemoffset =  0;
            var width = 700/this.data.length;
            if(itemid != 0){
                itemoffset = (700/this.data.length)*itemid - ((this.data[itemid-1].times[0].ending_time < element.times[0].starting_time) ? 50 : 0);

                newArray.forEach(element1 => {
                    var timeStampDatemoment = new Date(element1.enddate);
                    if(moment.monthsShort(timeStampDate.getMonth())+ "/"+timeStampDate.getDate() == moment.monthsShort(timeStampDatemoment.getMonth())+ "/"+timeStampDatemoment.getDate()){
                        itemoffset = element1.offset+itemid*10;
                        element1.duration = element1.duration+ width - itemid*10;
                        projectDuration = element1.duration- itemid*10;
                    }
                });
            }
            itemid++;
            if(colorindex == 6){
                colorindex = 0;;
            }
            newArray.push({label:element.times[0].label.toUpperCase(),duration: projectDuration, endDate:timeLabel,offset: itemoffset,startdate : element.times[0].starting_time,enddate: element.times[0].ending_time,color: colorcode[colorindex]});
            colorindex++;
        });
        this.finalArray = newArray;
        newArray.forEach(item => {
            arrayForXaxis.push({endDate:item.endDate,offset: (item.offset+item.duration)});
        });
        var parr = [];
        arrayForXaxis.filter(function(item){
            var it = parr.findIndex(x => (x.endDate == item.endDate && x.offset == item.offset));
            if(it <= -1){
                parr.push(item);
            }
            return null;
        });
        this.finalXAsxisArray = parr;
    }
}
