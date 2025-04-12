export function getPropertyNameByType<T>(property: keyof T): keyof T {
	return property;
}

export function getPropertyNameByObject<T>(obj: T, property: keyof T): keyof T {
	return property;
}
