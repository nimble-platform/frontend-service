"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var core_1 = require('@angular/core');
var credentials_1 = require('./credentials');
var credentials_service_1 = require('./credentials.service');
var myGlobals = require('./globals');
var CredentialsFormComponent = (function () {
    function CredentialsFormComponent(credentialsService) {
        this.credentialsService = credentialsService;
        this.submitted = false;
        this.callback = false;
        this.error_detc = false;
        this.debug = myGlobals.debug;
        this.model = new credentials_1.Credentials('', '');
        this.objToSubmit = new credentials_1.Credentials('', '');
        this.response = new credentials_1.Credentials('', '');
    }
    CredentialsFormComponent.prototype.post = function (credentials) {
        var _this = this;
        this.credentialsService.post(credentials)
            .then(function (credentials) {
            _this.response = credentials;
            _this.callback = true;
            _this.error_detc = false;
        })
            .catch(function (error) {
            _this.error_detc = true;
        });
    };
    CredentialsFormComponent.prototype.reset = function () {
        this.submitted = false;
        this.callback = false;
        this.error_detc = false;
        this.model = new credentials_1.Credentials('', '');
        this.objToSubmit = new credentials_1.Credentials('', '');
        this.response = new credentials_1.Credentials('', '');
    };
    CredentialsFormComponent.prototype.onSubmit = function () {
        this.objToSubmit = JSON.parse(JSON.stringify(this.model));
        this.shaObj = new jsSHA("SHA-256", "TEXT");
        this.shaObj.update(this.model.password);
        this.objToSubmit.password = this.shaObj.getHash("HEX");
        this.submitted = true;
        this.post(this.objToSubmit);
    };
    CredentialsFormComponent = __decorate([
        core_1.Component({
            selector: 'credentials-form',
            templateUrl: './credentials-form.component.html'
        }), 
        __metadata('design:paramtypes', [credentials_service_1.CredentialsService])
    ], CredentialsFormComponent);
    return CredentialsFormComponent;
}());
exports.CredentialsFormComponent = CredentialsFormComponent;
//# sourceMappingURL=credentials-form.component.js.map