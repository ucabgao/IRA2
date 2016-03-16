"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var aurelia_framework_1 = require('aurelia-framework');
require('material-design-lite');
var MdlButton = (function () {
    function MdlButton(element) {
        this.accent = false;
        this.colored = false;
        this.primary = false;
        this.raised = true;
        this.ripple = true;
        this.element = element;
    }
    MdlButton.prototype.attached = function () {
        var btn = this.element.querySelector('button');
        if (this.accent) {
            btn.classList.add('mdl-button--accent');
        }
        if (this.colored) {
            btn.classList.add('mdl-button--colored');
        }
        if (this.primary) {
            btn.classList.add('mdl-button--primary');
        }
        if (this.raised) {
            btn.classList.add('mdl-button--raised');
        }
        if (this.ripple) {
            btn.classList.add('mdl-js-ripple-effect');
        }
        componentHandler.upgradeElement(btn);
    };
    MdlButton.prototype.raisedChanged = function (newValue, oldValue) {
        var btn = this.element.querySelector('button');
        if (newValue) {
            btn.classList.add('mdl-button--raised');
        }
        else {
            btn.classList.remove('mdl-button--raised');
        }
    };
    __decorate([
        aurelia_framework_1.bindable()
    ], MdlButton.prototype, "accent");
    __decorate([
        aurelia_framework_1.bindable()
    ], MdlButton.prototype, "colored");
    __decorate([
        aurelia_framework_1.bindable()
    ], MdlButton.prototype, "primary");
    __decorate([
        aurelia_framework_1.bindable()
    ], MdlButton.prototype, "raised");
    __decorate([
        aurelia_framework_1.bindable()
    ], MdlButton.prototype, "ripple");
    MdlButton = __decorate([
        aurelia_framework_1.inject(Element)
    ], MdlButton);
    return MdlButton;
}());
exports.MdlButton = MdlButton;
