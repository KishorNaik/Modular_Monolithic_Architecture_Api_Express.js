export class SagaResult<T> {
	constructor(
		public isSuccess: boolean,
		public results: T
	) {}

	get IsSuccess(): boolean {
		return this.isSuccess;
	}

	set IsSuccess(value: boolean) {
		this.isSuccess = value;
	}

	get Results(): T {
		return this.results;
	}
}

export class CompensationActivityModel<T> {
	constructor(
		public compensationName: string,
		public action: (arg: SagaResult<T>) => Promise<void>
	) {}
}

interface ISagaActivity<T> {
	activityName?: string;
	action: () => Promise<SagaResult<T>>;
	compensations: Array<(arg: SagaResult<T>) => Promise<void>>;
}

export class SagaActivity<T> implements ISagaActivity<T> {
	compensations: Array<(arg: SagaResult<T>) => Promise<void>> = [];

	constructor(
		public action: () => Promise<SagaResult<T>>,
		public activityName?: string
	) {}

	get Action(): () => Promise<SagaResult<T>> {
		return async () => {
			const result = await this.action();
			return new SagaResult(result.isSuccess, result.results);
		};
	}

	get Compensations(): Array<(arg: SagaResult<T>) => Promise<void>> {
		return this.compensations.map((c) => async (r: SagaResult<T>) => {
			await c(new SagaResult(r.isSuccess, r.results));
		});
	}
}

export class ActivityResult<T> {
	constructor(
		public activityName: string,
		public sagaResult: SagaResult<T>
	) {}
}

export class SagaBuilder<TSagaResult> {
	private activities: ISagaActivity<TSagaResult>[] = [];
	public activityResults: ActivityResult<TSagaResult>[] = [];

	constructor(public sagaName?: string) {}

	activity(
		activityName: string,
		action: () => Promise<SagaResult<TSagaResult>>
	): SagaBuilder<TSagaResult> {
		this.activities.push(new SagaActivity<TSagaResult>(action, activityName));
		return this;
	}

	compensationActivity(
		activityName: string,
		compensationName: string,
		compensation: (arg: SagaResult<TSagaResult>) => Promise<void>
	): SagaBuilder<TSagaResult> {
		const activity = this.activities.find(
			(e) => e.activityName === activityName
		) as SagaActivity<TSagaResult>;
		if (activity) {
			activity.compensations.push(compensation);
		}
		return this;
	}

	async executeAsync(): Promise<void> {
		for (const activity of this.activities) {
			try {
				const result = await activity.action();

				if (result) {
					this.activityResults.push(
						new ActivityResult(activity.activityName || '', result)
					);
				}

				if (activity.compensations.length > 0) {
					for (const compensation of activity.compensations) {
						await compensation(result);
					}
				}
			} catch (ex) {
				console.error(`Activity ${activity.activityName} failed with error: ${ex.message}`);
				throw ex;
			}
		}
	}
}
