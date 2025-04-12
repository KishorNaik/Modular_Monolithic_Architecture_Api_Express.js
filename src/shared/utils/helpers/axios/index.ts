import { DataResponse } from '@/shared/models/response/data.Response';
import axios, {
	AxiosError,
	AxiosInstance,
	AxiosRequestConfig,
	AxiosResponse,
	InternalAxiosRequestConfig,
} from 'axios';
import { Err, Ok, Result } from 'neverthrow';
import { HttpException } from '../../exceptions/http';

export interface AxiosHelperConfig {
	baseURL: string;
	headers?: {
		apiKey?: string; // API key is optional
		token?: string; // JWT token is optional
	};
}

export class AxiosHelper {
	private axiosInstance: AxiosInstance;
	private apiKey?: string;
	private token?: string;

	public constructor(config: AxiosHelperConfig) {
		this.axiosInstance = axios.create({
			baseURL: config.baseURL,
		});
		this.apiKey = config?.headers?.apiKey;
		this.token = config?.headers?.token;

		this.axiosInstance.interceptors.request.use(
			(config: InternalAxiosRequestConfig) => {
				if (this.apiKey) {
					config.headers['x-api-key'] = this.apiKey;
				}

				if (this.token) {
					config.headers['Authorization'] = `Bearer ${this.token}`;
				}

				return config;
			},
			(error) => {
				return Promise.reject(error);
			}
		);
	}

	public async getAsync<TResponse>(
		endpoint: string,
		config?: AxiosRequestConfig
	): Promise<Result<DataResponse<TResponse>, HttpException>> {
		try {
			const response = await this.axiosInstance.get<DataResponse<TResponse>>(
				endpoint,
				config
			);
			return new Ok(response.data);
		} catch (ex) {
			if (axios.isAxiosError(ex)) {
				const axiosError = ex as AxiosError<DataResponse<TResponse>>;
				return new Err(
					new HttpException(
						axiosError.response?.data.StatusCode ?? 500,
						axiosError.response?.data?.Message || ex.message
					)
				);
			}

			return new Err(new HttpException(500, (<Error>ex).message));
		}
	}

	public async postAsync<TRequest, TResponse>(
		endPoint: string,
		data: TRequest,
		config?: AxiosRequestConfig
	): Promise<Result<DataResponse<TResponse>, HttpException>> {
		try {
			const response = await this.axiosInstance.post<DataResponse<TResponse>>(
				endPoint,
				data,
				config
			);
			return new Ok(response.data);
		} catch (ex) {
			if (axios.isAxiosError(ex)) {
				const axiosError = ex as AxiosError<DataResponse<TResponse>>;
				return new Err(
					new HttpException(
						axiosError.response?.data.StatusCode ?? 500,
						axiosError.response?.data?.Message || ex.message
					)
				);
			}

			return new Err(new HttpException(500, (<Error>ex).message));
		}
	}

	public async putAsync<TRequest, TResponse>(
		endPoint: string,
		data: TRequest,
		config?: AxiosRequestConfig
	): Promise<Result<DataResponse<TResponse>, HttpException>> {
		try {
			const response = await this.axiosInstance.put<DataResponse<TResponse>>(
				endPoint,
				data,
				config
			);
			return new Ok(response.data);
		} catch (ex) {
			if (axios.isAxiosError(ex)) {
				const axiosError = ex as AxiosError<DataResponse<TResponse>>;
				return new Err(
					new HttpException(
						axiosError.response?.data.StatusCode ?? 500,
						axiosError.response?.data?.Message || ex.message
					)
				);
			}

			return new Err(new HttpException(500, (<Error>ex).message));
		}
	}

	public async deleteAsync<TResponse>(
		endPoint: string,
		config?: AxiosRequestConfig
	): Promise<Result<DataResponse<TResponse>, HttpException>> {
		try {
			const response = await this.axiosInstance.delete<DataResponse<TResponse>>(
				endPoint,
				config
			);
			return new Ok(response.data);
		} catch (ex) {
			if (axios.isAxiosError(ex)) {
				const axiosError = ex as AxiosError<DataResponse<TResponse>>;
				return new Err(
					new HttpException(
						axiosError.response?.data.StatusCode ?? 500,
						axiosError.response?.data?.Message || ex.message
					)
				);
			}

			return new Err(new HttpException(500, (<Error>ex).message));
		}
	}

	public async patchAsync<TRequest, TResponse>(
		endPoint: string,
		data: TRequest,
		config?: AxiosRequestConfig
	): Promise<Result<DataResponse<TResponse>, HttpException>> {
		try {
			const response = await this.axiosInstance.patch<DataResponse<TResponse>>(
				endPoint,
				data,
				config
			);
			return new Ok(response.data);
		} catch (ex) {
			if (axios.isAxiosError(ex)) {
				const axiosError = ex as AxiosError<DataResponse<TResponse>>;
				return new Err(
					new HttpException(
						axiosError.response?.data.StatusCode ?? 500,
						axiosError.response?.data?.Message || ex.message
					)
				);
			}

			return new Err(new HttpException(500, (<Error>ex).message));
		}
	}
}
