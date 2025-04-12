import { userModule } from './users';

export const modulesFederation: Function[] = [...userModule];
export const modulesFederationPubSubConsumers: Function[] = [];
export const modulesFederationRequestReplyConsumers: Function[] = [];
