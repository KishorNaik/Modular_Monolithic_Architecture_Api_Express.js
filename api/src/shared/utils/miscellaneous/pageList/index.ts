import { SelectQueryBuilder } from 'typeorm';

export class PagedList<T> {
	selectQueryBuilder: SelectQueryBuilder<T>;
	currentPage: number;
	totalPages: number;
	pageSize: number;
	totalCount: number;

	constructor(
		selectQueryBuilder: SelectQueryBuilder<T>,
		count: number,
		pageNumber: number,
		pageSize: number
	) {
		this.selectQueryBuilder = selectQueryBuilder;
		this.totalCount = count;
		this.pageSize = pageSize;
		this.currentPage = pageNumber;
		this.totalPages = Math.ceil(count / pageSize);
	}

	get hasPrevious(): boolean {
		return this.currentPage > 1;
	}

	get hasNext(): boolean {
		return this.currentPage < this.totalPages;
	}

	public static async toPagedListAsync<T>(
		queryBuilder: SelectQueryBuilder<T>,
		pageNumber: number,
		pageSize: number
	): Promise<PagedList<T>> {
		const countPromise = queryBuilder.getCount();
		const queryBuilderPaginationPromise = queryBuilder
			.skip((pageNumber - 1) * pageSize)
			.take(pageSize);

		const [count, queryBuilderPagination] = await Promise.all([
			countPromise,
			queryBuilderPaginationPromise,
		]);

		return new PagedList<T>(queryBuilderPagination, count, pageNumber, pageSize);
	}
}
