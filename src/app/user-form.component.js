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
var user_1 = require('./user');
var user_service_1 = require('./user.service');
var myGlobals = require('./globals');
var UserFormComponent = (function () {
    function UserFormComponent(userService) {
        this.userService = userService;
        this.submitted = false;
        this.callback = false;
        this.debug = myGlobals.debug;
        /* ToDo: Hackathon only BEGIN */
        this.model = new user_1.User('', '', '', '', '', '', '', '', '', '', '', '');
        this.objToSubmit = new user_1.User('', '', '', '', '', '', '', '', '', '', '', '');
        this.response = new user_1.User('', '', '', '', '', '', '', '', '', '', '', '');
    }
    UserFormComponent.prototype.post = function (user) {
        var _this = this;
        this.userService.post(user)
            .then(function (user) {
            _this.response = user;
            _this.callback = true;
        });
    };
    UserFormComponent.prototype.reset = function () {
        this.submitted = false;
        this.callback = false;
        /* ToDo: Hackathon only BEGIN */
        this.model = new user_1.User('', '', '', '', '', '', '', '', '', '', '', '');
        this.objToSubmit = new user_1.User('', '', '', '', '', '', '', '', '', '', '', '');
        this.response = new user_1.User('', '', '', '', '', '', '', '', '', '', '', '');
        //model = new User('','','','','','','','','');
        //objToSubmit = new User('','','','','','','','','');
        //response = new User('','','','','','','','','');
        /* ToDo: Hackathon only END */
    };
    UserFormComponent.prototype.onSubmit = function () {
        this.objToSubmit = JSON.parse(JSON.stringify(this.model));
        this.shaObj = new jsSHA("SHA-256", "TEXT");
        this.shaObj.update(this.model.password);
        this.objToSubmit.password = this.shaObj.getHash("HEX");
        //this.objToSubmit.dateOfBirth = new Date(this.model.dateOfBirth).toISOString();
        this.submitted = true;
        this.post(this.objToSubmit);
    };
    UserFormComponent = __decorate([
        core_1.Component({
            selector: 'user-form',
            templateUrl: './user-form.component.html'
        }), 
        __metadata('design:paramtypes', [user_service_1.UserService])
    ], UserFormComponent);
    return UserFormComponent;
}());
exports.UserFormComponent = UserFormComponent;
//# sourceMappingURL=user-form.component.js.map