export enum Order {
	ASC,
	DESC,
}

export interface ISort {
	by: string[];
	direction: Order;
}
