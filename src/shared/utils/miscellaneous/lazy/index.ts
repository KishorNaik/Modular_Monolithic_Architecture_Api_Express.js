export class Lazy<T> {
	private factory: () => T;
	private _value: T | undefined;
	private isValueCreated: boolean = false;

	constructor(factory: () => T) {
		this.factory = factory;
	}

	public get value(): T {
		if (!this.isValueCreated) {
			this._value = this.factory();
			this.isValueCreated = true;
		}
		return this._value!;
	}
}
