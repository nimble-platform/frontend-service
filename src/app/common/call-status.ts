/**
 * Created by suat on 29-Sep-17.
 */
export class CallStatus {
    constructor(
        public fb_submitted = false,
        public fb_callback = false,
        public fb_errordetc = false,
        public fb_autoCloseOnCallBack = false,
        public fb_message = ""
    ) {    }

    public submit() {
        this.fb_submitted = true;
        this.fb_errordetc = false;
        this.fb_callback = false;
    }

    public callback(msg:string, autoClose:boolean = false) {
        this.fb_message = msg;
        this.fb_submitted = false;
        this.fb_errordetc = false;
        this.fb_callback = msg != null;
        this.fb_autoCloseOnCallBack = autoClose;
    }

    public error(msg:string) {
        this.fb_message = msg;
        this.fb_submitted = false;
        this.fb_errordetc = true;
        this.fb_callback = false;
    }

    public reset() {
        this.fb_submitted = false;
        this.fb_errordetc = false;
        this.fb_callback = false;
    }
}