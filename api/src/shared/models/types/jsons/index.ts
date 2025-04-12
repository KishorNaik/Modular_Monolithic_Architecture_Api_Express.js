export type JSONValue = string | number | boolean | null | JSONObject | JSONArray;

export interface JSONArray extends Array<JSONValue> {}

export interface JSONObject {
	[key: string]: JSONValue;
}

export type JsonStringGeneric<T> = string & { __jsonString: T };

export type JsonString = string & { __jsonString: true };
