import { Component, OnInit } from "@angular/core";
import { AnalyticsService } from "./analytics.service";
import { CallStatus } from "../common/call-status";

@Component({
    selector: "trust-policy",
    templateUrl: "./trust-policy.component.html",
    styleUrls: ["./trust-policy.component.css"]
})
export class TrustPolicyComponent implements OnInit {

    alertClosed = false;
    policy:any = null;
    policy_tmp:any = null;
    callStatus: CallStatus = new CallStatus();
    saveCallStatus: CallStatus = new CallStatus();

    constructor(private analyticsService: AnalyticsService) {

    }

    ngOnInit(): void {
        this.callStatus.submit();
        this.analyticsService
            .getTrustPolicy()
            .then(res => {
				        this.policy = res;
                if (this.policy && this.policy.trustAttributes && this.policy.trustAttributes.length>0) {
                  this.policy.trustAttributes.sort((a,b)=>a.attributeType.name.localeCompare(b.attributeType.name));
                }
                this.policy_tmp = JSON.stringify(this.policy);
                this.callStatus.callback("Successfully loaded trust policy", true);
            })
            .catch(error => {
				        this.policy = null;
                this.policy_tmp = null;
                this.callStatus.error("Error while loading trust policy", error);
            });
    }

    initTrustPolicy() {
      this.saveCallStatus.submit();
      this.analyticsService
          .initTrustPolicy()
          .then(res => {
              this.saveCallStatus.callback("Successfully initialized trust policy", true);
              this.ngOnInit();
          })
          .catch(error => {
              this.saveCallStatus.error("Error while initializing trust policy", error);
          });
    }

    saveTrustPolicy() {
      this.saveCallStatus.submit();
      this.analyticsService
          .setTrustPolicy(this.policy)
          .then(res => {
              this.saveCallStatus.callback("Successfully saved trust policy", true);
              this.ngOnInit();
          })
          .catch(error => {
              this.saveCallStatus.error("Error while saving trust policy", error);
          });
    }

    policyUnchanged() {
      var comp_a = JSON.stringify(this.policy);
      var comp_b = this.policy_tmp;
      return (comp_a.localeCompare(comp_b) == 0);
    }

    isLoading(): boolean {
        return this.callStatus.fb_submitted;
    }
}
