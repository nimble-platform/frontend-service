/**
 * Created by suat on 29-Sep-17.
 */
export class CallStatus {

    constructor(
        public fb_submitted = false,
        public fb_callback = false,
        public fb_errordetc = false,
        public fb_autoCloseOnCallBack = false,
        public fb_message = "",
        public fb_details = "",
        public fb_showDetails = false
    ) {    }

    public submit() {
        this.fb_submitted = true;
        this.fb_errordetc = false;
        this.fb_callback = false;
    }

    public callback(msg: string, autoClose: boolean = false) {
        this.fb_message = msg;
        this.fb_submitted = false;
        this.fb_errordetc = false;
        this.fb_callback = msg != null;
        this.fb_autoCloseOnCallBack = autoClose;
    }

    public error(msg: string, error?: any) {
        this.fb_message = msg;
        this.fb_submitted = false;
        this.fb_errordetc = true;
        this.fb_callback = false;
        this.fb_details = "";
        this.fb_showDetails = false;
        if(error) {
            this.fb_details = "Error "+error.status;
            if (error._body != "") {
              let errorJSON = {};
              try {
                  errorJSON = JSON.parse(error._body);
                  if (errorJSON["error"] || errorJSON["exception"] || errorJSON["message"]) {
                      if (errorJSON["error"]) {
                          this.fb_details += "<br/>";
                          this.fb_details += errorJSON["error"];
                      }
                      if (errorJSON["message"]) {
                          this.fb_details += "<br/>";
                          this.fb_details += errorJSON["message"];
                      }
                      if (errorJSON["exception"]) {
                          this.fb_details += "<br/>";
                          this.fb_details += errorJSON["exception"];
                      }
                  }

                // the error data is not in the json format, so it's shown as it is
              } catch (e) {
                  if(error._body != null) {
                      this.fb_details = error._body;
                  } else {
                      this.fb_details = error;
                  }
              }
            }
        }
    }

    public reset() {
        this.fb_submitted = false;
        this.fb_errordetc = false;
        this.fb_callback = false;
    }

    public isLoading(): boolean {
        return this.fb_submitted;
    }

    public isDisplayed(): boolean {
        return this.fb_submitted || this.fb_errordetc || (this.fb_callback && !this.fb_autoCloseOnCallBack);
    }

    public isError(): boolean {
        return this.fb_errordetc;
    }
}
