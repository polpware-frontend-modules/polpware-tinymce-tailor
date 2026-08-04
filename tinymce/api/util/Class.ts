/**
 * @license MIT License
 *
 * This file is a modern TypeScript conversion of a classical inheritance
 * utility, originally based on code by John Resig. It now uses native
 * ES module and class syntax.
 */

import Tools from './Tools';

const { each, extend } = Tools;

let extendClass: (prop: any) => any, initializing: boolean;

const Class: any = function() {
    // empty constructor
};

// Provides classical inheritance, based on code made by John Resig
Class.extend = extendClass = function(prop: any) {
    const self = this, _super = self.prototype;
    let prototype: any, name: string, member: any;

    // The dummy class constructor
    const NewClass: any = function(this: any) {
        let i: number, mixins: any[], mixin: any;
        const self = this;

        // All construction is actually done in the init method
        if (!initializing) {
            // Run class constuctor
            if (self.init) {
                self.init.apply(self, arguments);
            }

            // Run mixin constructors
            mixins = self.Mixins;
            if (mixins) {
                i = mixins.length;
                while (i--) {
                    mixin = mixins[i];
                    if (mixin.init) {
                        mixin.init.apply(self, arguments);
                    }
                }
            }
        }
    };

    // Dummy function, needs to be extended in order to provide functionality
    const dummy = function(this: any) {
        return this;
    };

    // Creates a overloaded method for the class
    // this enables you to use this._super(); to call the super function
    const createMethod = function(name: string, fn: Function) {
        return function(this: any) {
            let tmp = this._super, ret: any;

            this._super = _super[name];
            ret = fn.apply(this, arguments);
            this._super = tmp;

            return ret;
        };
    };

    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;

    /*eslint new-cap:0 */
    prototype = new self();
    initializing = false;

    // Add mixins
    if (prop.Mixins) {
        each(prop.Mixins, function(mixin: any) {
            for (const name in mixin) {
                if (name !== 'init') {
                    prop[name] = mixin[name];
                }
            }
        });

        if (_super.Mixins) {
            prop.Mixins = _super.Mixins.concat(prop.Mixins);
        }
    }

    // Generate dummy methods
    if (prop.Methods) {
        each(prop.Methods.split(','), function(name: string) {
            prop[name] = dummy;
        });
    }

    // Generate property methods
    if (prop.Properties) {
        each(prop.Properties.split(','), function(name: string) {
            const fieldName = '_' + name;

            prop[name] = function(this: any, value?: any) {
                let undef: any;

                // Set value
                if (value !== undef) {
                    this[fieldName] = value;
                    return this;
                }

                // Get value
                return this[fieldName];
            };
        });
    }

    // Static functions
    if (prop.Statics) {
        each(prop.Statics, function(func: Function, name: string) {
            NewClass[name] = func;
        });
    }

    // Default settings
    if (prop.Defaults && _super.Defaults) {
        prop.Defaults = extend({}, _super.Defaults, prop.Defaults);
    }

    // Copy the properties over onto the new prototype
    for (name in prop) {
        member = prop[name];

        if (typeof member === 'function' && _super[name]) {
            prototype[name] = createMethod(name, member);
        } else {
            prototype[name] = member;
        }
    }

    // Populate our constructed prototype object
    NewClass.prototype = prototype;

    // Enforce the constructor to be what we expect
    NewClass.constructor = NewClass;

    // And make this class extendible
    NewClass.extend = extendClass;

    return NewClass;
};

export default Class;
