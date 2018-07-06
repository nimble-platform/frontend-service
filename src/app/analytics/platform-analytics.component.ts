import {Component, OnInit} from '@angular/core';
import {AnalyticsService} from "./analytics.service";

@Component({
    selector: 'platform-analytics',
    templateUrl: './platform-analytics.component.html',
    styleUrls: ['./platform-analytics.component.css']
})

export class PlatformAnalyticsComponent implements OnInit {

    user_count = -1;
    comp_count = -1;
    bp_count = -1;
    trade_count = -1;
    green_perc = 0;
    yellow_perc = 0;
    red_perc = 0;
    green_perc_str = "0%";
    yellow_perc_str = "0%";
    red_perc_str = "0%";
    trade_green_perc = 0;
    trade_yellow_perc = 0;
    trade_red_perc = 0;
    trade_green_perc_str = "0%";
    trade_yellow_perc_str = "0%";
    trade_red_perc_str = "0%";
    loading = false;
    loading2 = false;

    constructor(
        private analyticsService: AnalyticsService
    ) {
    }

    ngOnInit(): void {
        this.loading = true;
        this.loading2 = true;
        this.analyticsService.getPlatAnalytics()
        .then(res => {
          this.loading = false;
          this.user_count = res.identity.totalUsers;
          this.comp_count = res.identity.totalCompanies;
          this.bp_count = res.businessProcessCount.total;
          this.green_perc = Math.round((res.businessProcessCount.state.approved*100)/this.bp_count);
          this.green_perc_str = this.green_perc+"%";
          this.yellow_perc = Math.round((res.businessProcessCount.state.waiting*100)/this.bp_count);
          this.yellow_perc_str = this.yellow_perc+"%";
          this.red_perc = 100 - this.green_perc - this.yellow_perc;
          this.red_perc_str = this.red_perc+"%";
    		})
        .catch(error => {
          this.loading = false;
  			});

        this.analyticsService.getTradingVolumeTotal("")
        .then(res => {
          if (isNaN(res) || res <= 0) {
            this.loading2 = false;
          }
          else {
            this.trade_count = parseInt(res);
            this.analyticsService.getTradingVolumeTotal("Approved")
            .then(res => {
              if (isNaN(res) || res <= 0) {}
              else {
                this.trade_green_perc = Math.round((res*100)/this.trade_count);
                this.trade_green_perc_str = this.trade_green_perc+"%";
                this.analyticsService.getTradingVolumeTotal("WaitingResponse")
                .then(res => {
                  if (isNaN(res) || res <= 0) {}
                  else {
                    this.trade_yellow_perc = Math.round((res*100)/this.trade_count);
                    this.trade_yellow_perc_str = this.trade_yellow_perc+"%";
                  }
                  this.trade_red_perc = 100 - this.trade_green_perc - this.trade_yellow_perc;
                  this.trade_red_perc_str = this.trade_red_perc+"%";
                  this.loading2 = false;
                })
                .catch(error => {
                  this.loading2 = false;
                });
              }
            })
            .catch(error => {
              this.loading2 = false;
            });
          }
        })
        .catch(error => {
          this.loading2 = false;
        });

    }

}
