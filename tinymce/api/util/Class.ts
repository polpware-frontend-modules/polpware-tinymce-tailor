/**
 * @license MIT License
 *
 * This file is a modern TypeScript conversion of a classical inheritance
 * utility, originally based on code by John Resig. It now uses native
 * ES module and class syntax.
 */

import Tools from './Tools';

const { each, extend } = Tools;

// Define the shape of a class definition object for type safety.
export interface IClassDefinition {
    init?: (...args: any[]) => void;
    Mixins?: any[];
    Methods?: string;
    Properties?: string;
    Statics?: Record<string, any>;
    Defaults?: Record<string, any>;
    [key: string]: any;
}

// A type alias for the constructor of a PolpwareClass.
type PolpwareClassConstructor<T extends PolpwareClass = PolpwareClass> = {
    new(...args: any[]): T;
    extend<U extends typeof PolpwareClass>(this: U, prop: IClassDefinition): U;
    Defaults?: Record<string, any>;
};

/**
 * A base class that provides a classical inheritance-style `extend` method.
 * All other classes created with this system will inherit from this class.
 */
class PolpwareClass {
    // The constructor for instances of this class.
    public init?(...args: any[]): void;

    // A placeholder for the superclass method, enabling `this._super()` calls.
    protected _super?: (...args: any[]) => any;

    // An array of mixin objects.
    public Mixins?: any[];

    // Default settings for the class.
    public static Defaults?: Record<string, any>;

    /**
     * Provides classical inheritance, based on code by John Resig.
     * This static method creates and returns a new class that inherits from `this` class.
     * @param prop An object defining the new class's properties, methods, and statics.
     * @returns A new class constructor.
     */
    public static extend<T extends PolpwareClassConstructor>(this: T, prop: IClassDefinition): T {
        const _super = this.prototype;
        let initializing = false;

        // The dummy class constructor
        const NewClass = function(this: PolpwareClass, ...args: any[]) {
            // All construction is actually done in the init method
            if (!initializing) {
                // Run the class constructor
                if (this.init) {
                    this.init(...args);
                }

                // Run mixin constructors
                const mixins = this.Mixins;
                if (mixins) {
                    for (const mixin of mixins) {
                        if (mixin.init) {
                            mixin.init.apply(this, args);
                        }
                    }
                }
            }
        } as any as T;

        // Instantiate a base class (but only create the instance,
        // don't run the init constructor)
        initializing = true;
        NewClass.prototype = new (this as any)();
        NewClass.prototype.constructor = NewClass;
        initializing = false;

        const prototype = NewClass.prototype;

        // --- Process the definition object ---

        // Add mixins to the prototype
        if (prop.Mixins) {
            each(prop.Mixins, (mixin) => {
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
            each(prop.Methods.split(','), (name) => {
                prop[name] = function(this: PolpwareClass) { return this; };
            });
        }

        // Generate property getter/setter methods
        if (prop.Properties) {
            each(prop.Properties.split(','), (name) => {
                const fieldName = `_${name}`;
                prop[name] = function(this: any, value?: any) {
                    if (value !== undefined) {
                        this[fieldName] = value;
                        return this;
                    }
                    return this[fieldName];
                };
            });
        }

        // Copy properties over onto the new prototype
        for (const name in prop) {
            const member = prop[name];
            // Check if we're overwriting a function on the superclass
            if (typeof member === 'function' && typeof _super[name] === 'function') {
                // Create a method that allows calling `this._super()`
                prototype[name] = (function(superMethod, fn) {
                    return function(this: PolpwareClass, ...args: any[]) {
                        const tmp = this._super;
                        this._super = superMethod;
                        const ret = fn.apply(this, args);
                        this._super = tmp;
                        return ret;
                    };
                })(_super[name], member);
            } else {
                prototype[name] = member;
            }
        }

        // Add static functions
        if (prop.Statics) {
            each(prop.Statics, (func, name) => {
                (NewClass as any)[name] = func;
            });
        }

        // Merge default settings
        if (prop.Defaults) {
            NewClass.Defaults = extend({}, this.Defaults as Object, prop.Defaults);
        }

        // Make this class extendible
        NewClass.extend = this.extend;

        return NewClass;
    }
}

export default PolpwareClass;
