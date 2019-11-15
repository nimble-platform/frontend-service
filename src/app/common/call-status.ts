/**
 * Created by suat on 29-Sep-17.
 */
export class CallStatus {

    callCount = 0
    errorCount = 0;
    successCount = 0;
    aggregatedErrors: [string, any][] = [];

    constructor(
        public fb_submitted = false,
        public fb_callback = false,
        public fb_errordetc = false,
        public fb_autoCloseOnCallBack = false,
        public fb_message = ""
    ) {    }

    public submit(reset = true) {
        if (reset) {
            this.reset();
        }
        this.fb_submitted = true;
        this.fb_errordetc = false;
        this.fb_callback = false;
        this.callCount++;
    }

    public callback(msg: string, autoClose: boolean = false) {
        this.fb_message = msg;
        this.fb_submitted = false;
        this.fb_errordetc = false;
        this.fb_callback = true;
        this.fb_autoCloseOnCallBack = autoClose;
        this.successCount++;
    }

    public error(msg: string, error: any = null) {
        this.fb_message = msg;
        this.fb_submitted = false;
        this.fb_errordetc = true;
        this.fb_callback = false;
        this.errorCount++;

        let errorDetails = '';
        if(error) {
            errorDetails = 'Error ' + error.status;
            if (error._body != "") {
              let errorJSON = {};
              try {
                  errorJSON = JSON.parse(error._body);
                  if (errorJSON["error"] || errorJSON["exception"] || errorJSON["message"]) {
                      if (errorJSON["error"]) {
                          errorDetails += "<br/>";
                          errorDetails += errorJSON["error"];
                      }
                      if (errorJSON["message"]) {
                          errorDetails += "<br/>";
                          errorDetails += errorJSON["message"];
                      }
                      if (errorJSON["exception"]) {
                          errorDetails += "<br/>";
                          errorDetails += errorJSON["exception"];
                      }
                  }

                // the error data is not in the json format, so it's shown as it is
              } catch (e) {
                  if(error._body != null) {
                      errorDetails = error._body;
                  } else {
                      errorDetails = error;
                  }
              }
            }
        }
        this.aggregatedErrors.push([msg, errorDetails]);
    }

    public aggregatedSubmit(aggregate = 1) {
        for (let i = 0; i < aggregate; i++) {
            this.submit(false);
        }
    }

    public aggregatedCallBack(msg: string = null, autoClose = true, aggregate = 1) {
        for (let i = 0; i < aggregate; i++) {
            this.callback(msg, autoClose);
        }
    }

    public aggregatedError(msg: string, error: any = null, aggregate = 1) {
        for (let i = 0; i < aggregate; i++) {
            this.error(msg, error);
        }
    }

    public reset() {
        this.fb_submitted = false;
        this.fb_errordetc = false;
        this.fb_callback = false;
        this.callCount = 0;
        this.successCount = 0;
        this.errorCount = 0;
        this.aggregatedErrors = [];
    }

    public isComplete(): boolean {
        return this.fb_callback || this.fb_errordetc;
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

    public isAllComplete(): boolean {
        return this.callExists() && this.callCount === (this.errorCount + this.successCount);
    }

    public isAllSuccessful(): boolean {
        return this.callExists() && this.callCount === this.successCount;
    }

    public callExists(): boolean {
        return this.callCount !== 0;
    }
}
